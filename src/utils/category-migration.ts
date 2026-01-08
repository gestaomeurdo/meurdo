import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/integrations/supabase/auth-provider";

const DEFAULT_CATEGORY_NAME = 'Sem Categoria';

/**
 * Garante que a categoria padrão 'Sem Categoria' exista e retorna seu ID.
 * Se a categoria não existir, ela é criada.
 * @returns O ID da categoria 'Sem Categoria'.
 */
export async function ensureDefaultCategoryExists(userId: string): Promise<string> {
  // 1. Tenta buscar a categoria
  let { data, error } = await supabase
    .from('categorias_despesa')
    .select('id')
    .eq('nome', DEFAULT_CATEGORY_NAME)
    .maybeSingle();

  if (error) {
    console.error("Erro ao buscar categoria padrão:", error);
    throw new Error(`Falha ao buscar categoria padrão: ${error.message}`);
  }

  if (data) {
    return data.id;
  }

  // 2. Se não existir, cria a categoria
  const { data: newCategory, error: createError } = await supabase
    .from('categorias_despesa')
    .insert({ 
      nome: DEFAULT_CATEGORY_NAME, 
      descricao: 'Lançamentos que perderam sua categoria original.',
      user_id: userId // Associa ao usuário logado
    })
    .select('id')
    .single();

  if (createError) {
    console.error("Erro ao criar categoria padrão:", createError);
    throw new Error(`Falha ao criar categoria padrão: ${createError.message}`);
  }

  return newCategory.id;
}

/**
 * Conta quantos lançamentos estão associados a uma categoria.
 */
export async function countEntriesInCategory(categoryId: string): Promise<number> {
  const { count, error } = await supabase
    .from('lancamentos_financeiros')
    .select('id', { count: 'exact', head: true })
    .eq('categoria_id', categoryId);

  if (error) {
    console.error("Erro ao contar lançamentos na categoria:", error);
    throw new Error(`Falha ao contar lançamentos: ${error.message}`);
  }
  
  return count ?? 0;
}

/**
 * Move todos os lançamentos de uma categoria para a categoria padrão 'Sem Categoria'.
 */
export async function migrateEntries(oldCategoryId: string, defaultCategoryId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('lancamentos_financeiros')
    .update({ categoria_id: defaultCategoryId })
    .eq('categoria_id', oldCategoryId)
    .eq('user_id', userId); // Garante que só movemos os lançamentos do usuário

  if (error) {
    console.error("Erro ao migrar lançamentos:", error);
    throw new Error(`Falha ao migrar lançamentos: ${error.message}`);
  }
}