import { supabase } from "@/integrations/supabase/client";
import { parseCurrencyInput } from "./formatters";
import { PaymentMethod } from "@/hooks/use-financial-entries";
import { format } from "date-fns";

// Define a estrutura dos dados brutos esperados do CSV
export interface RawCostEntry {
  Data: string;
  Descricao: string;
  Valor?: string; // Valor original (se o CSV usar 'Valor')
  Pagamentos?: string; // Valor se o CSV usar 'Pagamentos'
  Obra?: string; // Nome da Obra (opcional)
}

// Regras de categorização: Palavras-chave mapeadas para nomes de categorias
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

// Busca o mapa de categorias (nome -> id)
async function getCategoryMap(): Promise<Map<string, string>> {
  const { data, error } = await supabase
    .from('categorias_despesa')
    .select('id, nome');

  if (error) throw new Error(`Falha ao buscar categorias: ${error.message}`);
  
  const map = new Map<string, string>();
  data.forEach(cat => map.set(cat.nome, cat.id));
  return map;
}

// Busca o ID da Obra pelo nome (e cria se não existir)
async function getObraId(obraName: string, userId: string): Promise<string> {
  // 1. Tenta encontrar a obra existente
  const { data: existingObra } = await supabase
    .from('obras')
    .select('id')
    .eq('nome', obraName)
    .eq('user_id', userId)
    .single();

  if (existingObra) {
    return existingObra.id;
  }

  // 2. Cria nova obra (com valores padrão)
  const newObraData = {
    user_id: userId,
    nome: obraName,
    data_inicio: format(new Date(), 'yyyy-MM-dd'),
    orcamento_inicial: 0,
    status: 'ativa' as const,
  };

  const { data: newObra, error: createError } = await supabase
    .from('obras')
    .insert(newObraData)
    .select('id')
    .single();

  if (createError) {
    throw new Error(`Falha ao criar nova obra "${obraName}": ${createError.message}`);
  }

  return newObra.id;
}

// Função para categorizar uma única entrada
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

  // Padrão para 'Outros' se nenhuma correspondência for encontrada
  const defaultCategoryName = 'Outros';
  let defaultCategoryId = categoryMap.get(defaultCategoryName);

  if (!defaultCategoryId) {
    throw new Error(`Categoria padrão '${defaultCategoryName}' não encontrada.`);
  }

  return { categoryId: defaultCategoryId, categoryName: defaultCategoryName };
}

// Função principal de importação
export async function importFinancialEntries(rawEntries: RawCostEntry[], userId: string): Promise<{ successCount: number, errorCount: number, newCategories: string[] }> {
  if (!userId) throw new Error("Usuário não autenticado.");

  // 1. Configuração: Garante que a categoria 'Outros' exista e obtém o mapa de categorias
  const defaultCategoryName = 'Outros';
  let categoryMap = await getCategoryMap();
  
  if (!categoryMap.has(defaultCategoryName)) {
    const { data, error } = await supabase
      .from('categorias_despesa')
      .insert({ nome: defaultCategoryName, descricao: 'Lançamentos que não se encaixam em categorias existentes.' })
      .select('id, nome')
      .single();
    
    if (error) throw new Error(`Falha ao criar categoria padrão: ${error.message}`);
    categoryMap.set(data.nome, data.id);
  }

  // 2. Identifica nomes de Obra e obtém/cria IDs
  const targetObraName = "Golden BTS";
  const obraId = await getObraId(targetObraName, userId);
  
  // 3. Processa e prepara entradas para inserção
  let successCount = 0;
  let errorCount = 0;
  const entriesToInsert = [];

  for (const entry of rawEntries) {
    try {
      // Determina o valor a ser usado (Pagamentos ou Valor)
      const rawValue = entry.Pagamentos || entry.Valor;
      
      // Validação básica de dados: Apenas processa se tiver Data, Descricao E um valor de pagamento/valor
      if (!entry.Data || !entry.Descricao || !rawValue || rawValue.trim() === '') {
          errorCount++;
          continue;
      }

      const { categoryId } = categorizeEntry(entry.Descricao, categoryMap);
      
      // Limpa a string de valor (remove R$, espaços e usa parseCurrencyInput)
      const cleanedValueString = rawValue.replace(/R\$/g, '').trim();
      const parsedValue = parseCurrencyInput(cleanedValueString);
      
      if (isNaN(parsedValue) || parsedValue <= 0) {
          errorCount++;
          continue;
      }
      
      // Conversão de data DD/MM/YYYY para YYYY-MM-DD
      const parts = entry.Data.split('/');
      if (parts.length !== 3) {
          errorCount++;
          continue;
      }
      // Note: Date constructor is unreliable with DD/MM/YYYY. We manually construct the ISO string.
      const dateString = `${parts[2]}-${parts[1]}-${parts[0]}`;
      
      // Basic check if the resulting string is a valid date format
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
          errorCount++;
          continue;
      }

      entriesToInsert.push({
        obra_id: obraId,
        user_id: userId,
        data_gasto: dateString, // Usando a string YYYY-MM-DD
        categoria_id: categoryId,
        descricao: entry.Descricao.trim(),
        valor: parsedValue,
        forma_pagamento: 'Transferência' as PaymentMethod, // Forma de pagamento padrão
      });
      
    } catch (e) {
      console.error("[Importer] Erro ao processar entrada:", entry, e);
      errorCount++;
    }
  }

  // 4. Inserção em Massa
  if (entriesToInsert.length > 0) {
    // Filtra entradas duplicadas (baseado em data, descrição e valor)
    const uniqueEntries = entriesToInsert.filter((entry, index, self) =>
      index === self.findIndex((t) => (
        t.data_gasto === entry.data_gasto &&
        t.descricao === entry.descricao &&
        t.valor === entry.valor
      ))
    );
    
    const duplicates = entriesToInsert.length - uniqueEntries.length;
    errorCount += duplicates;
    
    const { error: insertError } = await supabase
      .from('lancamentos_financeiros')
      .insert(uniqueEntries);

    if (insertError) {
      console.error("[Importer] Erro na inserção em massa:", insertError);
      // Se houver erro na inserção em massa, assumimos que todas as entradas falharam
      throw new Error(`Falha na inserção em massa: ${insertError.message}`);
    }
    successCount = uniqueEntries.length;
  }

  return { successCount, errorCount, newCategories: [] };
}