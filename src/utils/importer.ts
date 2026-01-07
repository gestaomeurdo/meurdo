import { supabase } from "@/integrations/supabase/client";
import { parseCurrencyInput } from "./formatters";
import { PaymentMethod } from "@/hooks/use-financial-entries";
import { format } from "date-fns";

// Define a estrutura dos dados brutos esperados do CSV
export interface RawCostEntry {
  Data: string;
  Descricao: string;
  Valor: string; // String bruta do CSV
  Obra?: string; // Nome da Obra (opcional)
}

// Regras de categorização: Palavras-chave mapeadas para nomes de categorias
const CATEGORY_RULES: Record<string, string[]> = {
  'Material de Construção': ['cimento', 'areia', 'tijolo', 'ferragem', 'hidráulica', 'elétrica', 'piso', 'revestimento', 'argamassa', 'material', 'tubo', 'fio', 'telha'],
  'Contabilidade': ['contabilidade', 'contador', 'serviços contábeis'],
  'Impostos': ['imposto', 'iptu', 'taxa', 'iss', 'inss', 'darf'],
  'Deslocamentos': ['combustível', 'pedágio', 'gasolina', 'diesel', 'viagem', 'uber', 'taxi'],
  'Mão de Obra - Wellinton': ['wellinton', 'mão de obra wellinton', 'diária wellinton'],
  'Terreno': ['terreno', 'compra terreno', 'documentação terreno'],
  'Gestão': ['software', 'licença', 'escritório', 'administrativo', 'internet', 'telefone'],
  'Concreto Usinado': ['concreto usinado', 'usinado', 'bomba de concreto'],
  'Madeira': ['madeira', 'telhado', 'caibro', 'sarrafo', 'compensado'],
  'Topógrafo': ['topógrafo', 'topografia', 'medição'],
  'Eletricista': ['eletricista', 'serviço elétrico', 'instalação elétrica'],
  'Gesseiro': ['gesseiro', 'gesso', 'drywall', 'forro'],
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
  const uniqueObraNames = Array.from(new Set(rawEntries.map(e => e.Obra).filter(Boolean) as string[]));
  if (!uniqueObraNames.includes(targetObraName)) {
      uniqueObraNames.push(targetObraName);
  }
  
  const obraIdMap = new Map<string, string>();
  for (const obraName of uniqueObraNames) {
    const obraId = await getObraId(obraName, userId);
    obraIdMap.set(obraName, obraId);
  }

  // 3. Processa e prepara entradas para inserção
  let successCount = 0;
  let errorCount = 0;
  const entriesToInsert = [];

  for (const entry of rawEntries) {
    try {
      // Validação básica de dados
      if (!entry.Data || !entry.Descricao || !entry.Valor) {
          errorCount++;
          continue;
      }

      const { categoryId } = categorizeEntry(entry.Descricao, categoryMap);
      
      const obraName = entry.Obra || targetObraName; // Padrão para Golden BTS
      const obraId = obraIdMap.get(obraName);
      
      if (!obraId) {
          errorCount++;
          continue;
      }

      const parsedValue = parseCurrencyInput(entry.Valor);
      if (isNaN(parsedValue) || parsedValue <= 0) {
          errorCount++;
          continue;
      }
      
      // Validação de data
      const dateObj = new Date(entry.Data);
      if (isNaN(dateObj.getTime())) {
          errorCount++;
          continue;
      }

      entriesToInsert.push({
        obra_id: obraId,
        user_id: userId,
        data_gasto: format(dateObj, 'yyyy-MM-dd'),
        categoria_id: categoryId,
        descricao: entry.Descricao,
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
    const { error: insertError } = await supabase
      .from('lancamentos_financeiros')
      .insert(entriesToInsert);

    if (insertError) {
      console.error("[Importer] Erro na inserção em massa:", insertError);
      throw new Error(`Falha na inserção em massa: ${insertError.message}`);
    }
    successCount = entriesToInsert.length;
  }

  return { successCount, errorCount, newCategories: [] };
}