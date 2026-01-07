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

  if (!defaultCategoryId) {
    throw new Error(`Categoria padrão '${defaultCategoryName}' não encontrada.`);
  }

  return { categoryId: defaultCategoryId, categoryName: defaultCategoryName };
}

export async function importFinancialEntries(
  rawEntries: RawCostEntry[], 
  userId: string, 
  obraId: string
): Promise<{ successCount: number, errorCount: number, newCategories: string[] }> {
  console.log(`[Importer] Iniciando importação para Obra ID: ${obraId}, Total de entradas: ${rawEntries.length}`);
  
  if (!userId) throw new Error("Usuário não autenticado.");
  if (!obraId) throw new Error("ID da obra não fornecido.");

  const categoryMap = await getCategoryMap();
  
  if (!categoryMap.has('Outros')) {
    const { data, error } = await supabase
      .from('categorias_despesa')
      .insert({ nome: 'Outros', descricao: 'Lançamentos sem categoria definida.' })
      .select('id, nome')
      .single();
    
    if (error) throw new Error(`Falha ao criar categoria padrão: ${error.message}`);
    categoryMap.set(data.nome, data.id);
  }

  let errorCount = 0;
  const entriesToInsert = [];

  for (const entry of rawEntries) {
    try {
      const rawValue = entry.Pagamentos || entry.Valor;
      
      if (!entry.Data || !entry.Descricao || !rawValue || rawValue.trim() === '') {
          errorCount++;
          continue;
      }

      const { categoryId } = categorizeEntry(entry.Descricao, categoryMap);
      const cleanedValueString = rawValue.toString().replace(/R\$/g, '').replace(/"/g, '').replace(/\s/g, '').trim();
      const parsedValue = parseCurrencyInput(cleanedValueString);
      
      if (isNaN(parsedValue) || parsedValue <= 0) {
          errorCount++;
          continue;
      }
      
      let dateString: string;
      const dateParts = entry.Data.includes('/') ? entry.Data.split('/') : entry.Data.split('-');
      
      if (dateParts.length === 3) {
          if (dateParts[0].length === 4) { // YYYY-MM-DD
            dateString = `${dateParts[0]}-${dateParts[1].padStart(2, '0')}-${dateParts[2].padStart(2, '0')}`;
          } else { // DD/MM/YYYY
            dateString = `${dateParts[2]}-${dateParts[1].padStart(2, '0')}-${dateParts[0].padStart(2, '0')}`;
          }
      } else {
          errorCount++;
          continue;
      }

      entriesToInsert.push({
        obra_id: obraId,
        user_id: userId,
        data_gasto: dateString,
        categoria_id: categoryId,
        descricao: entry.Descricao.trim(),
        valor: parsedValue,
        forma_pagamento: 'Transferência' as PaymentMethod,
      });
      
    } catch (e) {
      console.error("[Importer] Erro na linha:", entry, e);
      errorCount++;
    }
  }

  if (entriesToInsert.length > 0) {
    // Usamos um Set para identificação única rápida
    const seen = new Set();
    const uniqueEntries = entriesToInsert.filter(entry => {
      const key = `${entry.data_gasto}|${entry.descricao}|${entry.valor}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    
    const duplicates = entriesToInsert.length - uniqueEntries.length;
    errorCount += duplicates;
    
    console.log(`[Importer] Inserindo ${uniqueEntries.length} registros únicos...`);

    const { error: insertError } = await supabase
      .from('lancamentos_financeiros')
      .insert(uniqueEntries);

    if (insertError) {
      console.error("[Importer] Erro Supabase:", insertError);
      throw new Error(`Erro ao inserir no banco: ${insertError.message}`);
    }
    
    return { successCount: uniqueEntries.length, errorCount, newCategories: [] };
  }

  return { successCount: 0, errorCount, newCategories: [] };
}