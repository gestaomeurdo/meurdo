import { supabase } from "@/integrations/supabase/client";
import { parseCurrencyInput } from "./formatters";
import { PaymentMethod } from "@/hooks/use-financial-entries";

export interface RawCostEntry {
  Data: string;
  Descricao: string;
  Valor?: string;
  Pagamentos?: string;
  Obra?: string;
}

const CATEGORY_RULES: Record<string, string[]> = {
  'Material de Construção': ['cimento', 'areia', 'tijolo', 'ferragem', 'hidráulica', 'elétrica', 'piso', 'revestimento', 'argamassa', 'material', 'tubo', 'fio', 'telha', 'cal', 'prego', 'maderite', 'sarrafo', 'corrugados', 'conexões', 'veda reboco', 'lona', 'massa corrida', 'rejuntes', 'silicone', 'nichos', 'cunhas', 'blocos', 'ferros', 'arames', 'fita multiuso', 'chuveiro', 'capas de artefatos'],
  'Contabilidade': ['contabilidade', 'contador', 'serviços contábeis', 'rh contabilidade honorários'],
  'Impostos': ['imposto', 'iptu', 'taxa', 'iss', 'inss', 'darf', 'ministério da fazenda', 'irrf', 'taxa jusesc', 'taxa prefeitura', 'certidão de conformidade ambiental', 'guia tabelionato', 'guia cartório'],
  'Deslocamentos': ['combustível', 'pedágio', 'gasolina', 'diesel', 'viagem', 'uber', 'taxi', 'deslocamentos e pedágios', 'frete'],
  'Mão de Obra - Wellinton': ['wellinton', 'mão de obra wellinton', 'diária wellinton'],
  'Terreno': ['terreno', 'compra terreno', 'documentação terreno', 'itbi', 'escritura do terreno', 'registro do terreno'],
  'Gestão': ['software', 'licença', 'escritório', 'administrativo', 'internet', 'telefone', 'assinatura didital', 'alvará', 'banner', 'tráfego pago', 'parcela gestão', 'plantão sábado nexus imobiliária'],
  'Concreto Usinado': ['concreto usinado', 'usinado', 'bomba de concreto', 'caminhão concreto', 'laje'],
  'Madeira': ['madeira', 'telhado', 'caibro', 'sarrafo', 'compensado', 'madeira gtr', 'maderite pinus'],
  'Topógrafo': ['topógrafo', 'topografia', 'medição', 'sondagem'],
  'Eletricista': ['eletricista', 'serviço elétrico', 'instalação elétrica', 'eletrecista tom', 'eletrecista alexandre', 'mudança do poste de luz', 'energia elétrica'],
  'Gesseiro': ['gesseiro', 'gesso', 'drywall', 'forro', 'gessos'],
  'Serviços Externos': ['calhas', 'infra ar condicionado', 'mármore', 'esquadrias ems', 'pintor', 'ilha tintas', 'cortes rodapés', 'máquina', 'cambinhões', 'terra', 'fossas', 'filtro', 'sumidouro'],
  'Mão de Obra': ['mão de obra', 'pedreiros', 'diária'],
};

async function getCategoryMap(): Promise<Map<string, string>> {
  const { data, error } = await supabase
    .from('categorias_despesa')
    .select('id, nome');

  if (error) throw new Error(`Falha ao buscar categorias: ${error.message}`);
  
  const map = new Map<string, string>();
  data.forEach(cat => map.set(cat.nome, cat.id));
  return map;
}

function categorizeEntry(description: string, categoryMap: Map<string, string>): { categoryId: string, categoryName: string } {
  const lowerDesc = description.toLowerCase();

  for (const [categoryName, keywords] of Object.entries(CATEGORY_RULES)) {
    if (keywords.some(keyword => lowerDesc.includes(keyword))) {
      const categoryId = categoryMap.get(categoryName);
      if (categoryId) {
        return { categoryId, categoryName };
      }
    }
  }

  const defaultCategoryName = 'Outros';
  const defaultCategoryId = categoryMap.get(defaultCategoryName);
  return { categoryId: defaultCategoryId || '', categoryName: defaultCategoryName };
}

export async function importFinancialEntries(
  rawEntries: RawCostEntry[], 
  userId: string, 
  obraId: string
): Promise<{ successCount: number, errorCount: number, newCategories: string[] }> {
  console.log(`[Importer] Iniciando importação. Linhas brutas: ${rawEntries.length}`);
  
  if (!userId || !obraId) throw new Error("Usuário ou Obra não identificados.");

  const categoryMap = await getCategoryMap();
  
  // Garante categoria 'Outros'
  if (!categoryMap.has('Outros')) {
    const { data, error } = await supabase
      .from('categorias_despesa')
      .insert({ nome: 'Outros', descricao: 'Lançamentos gerais.', user_id: userId })
      .select('id, nome')
      .single();
    if (!error) categoryMap.set(data.nome, data.id);
  }

  let errorCount = 0;
  const entriesToInsert = [];

  for (const entry of rawEntries) {
    try {
      const dataStr = entry.Data?.toString().trim();
      const descStr = entry.Descricao?.toString().trim();
      const valStr = (entry.Pagamentos || entry.Valor || "").toString().trim();

      // REGRA: Ignorar linhas de totalização do Excel
      if (dataStr.toLowerCase().startsWith('total') || descStr.toLowerCase().startsWith('total')) {
          console.log("[Importer] Linha de total ignorada:", entry);
          continue;
      }

      if (!dataStr || !descStr || !valStr) {
          errorCount++;
          continue;
      }

      const parsedValue = parseCurrencyInput(valStr);
      if (isNaN(parsedValue) || parsedValue <= 0) {
          errorCount++;
          continue;
      }
      
      // Tratamento de Data (DD/MM/YYYY)
      let dateIso: string;
      const parts = dataStr.split(/[/-]/);
      if (parts.length === 3) {
          if (parts[0].length === 4) { // YYYY-MM-DD
            dateIso = `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
          } else { // DD/MM/YYYY
            dateIso = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
          }
      } else {
          errorCount++;
          continue;
      }

      const { categoryId } = categorizeEntry(descStr, categoryMap);

      entriesToInsert.push({
        obra_id: obraId,
        user_id: userId,
        data_gasto: dateIso,
        categoria_id: categoryId || categoryMap.get('Outros'),
        descricao: descStr,
        valor: parsedValue,
        forma_pagamento: 'Transferência' as PaymentMethod,
      });
      
    } catch (e) {
      console.error("[Importer] Erro na linha:", entry, e);
      errorCount++;
    }
  }

  if (entriesToInsert.length > 0) {
    const { error } = await supabase.from('lancamentos_financeiros').insert(entriesToInsert);
    if (error) throw new Error(error.message);
    return { successCount: entriesToInsert.length, errorCount, newCategories: [] };
  }

  return { successCount: 0, errorCount, newCategories: [] };
}