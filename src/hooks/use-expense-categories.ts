import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/integrations/supabase/auth-provider";
import { ensureDefaultCategoryExists, migrateEntries, countEntriesInCategory } from "@/utils/category-migration";

export interface ExpenseCategory {
  id: string;
  nome: string;
  descricao: string | null;
  user_id?: string | null;
}

// --- Fetching ---
const fetchExpenseCategories = async (): Promise<ExpenseCategory[]> => {
  const { data, error } = await supabase
    .from('categorias_despesa')
    .select('id, nome, descricao, user_id')
    .order('nome', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }
  return data as ExpenseCategory[];
};

export const useExpenseCategories = () => {
  return useQuery<ExpenseCategory[], Error>({
    queryKey: ['expenseCategories'],
    queryFn: fetchExpenseCategories,
    staleTime: 1000 * 60 * 5, // Cache categories for 5 minutos
  });
};

// --- Mutations ---

interface CategoryInput {
  nome: string;
  descricao: string | null;
}

export const useCreateExpenseCategory = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation<ExpenseCategory, Error, CategoryInput>({
    mutationFn: async (newCategory) => {
      if (!user) throw new Error("Usuário não autenticado.");
      
      const { data, error } = await supabase
        .from('categorias_despesa')
        .insert({ ...newCategory, user_id: user.id })
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data as ExpenseCategory;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenseCategories'] });
    },
  });
};

export const useUpdateExpenseCategory = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation<ExpenseCategory, Error, CategoryInput & { id: string }>({
    mutationFn: async (updatedCategory) => {
      if (!user) throw new Error("Usuário não autenticado.");
      const { id, ...rest } = updatedCategory;
      
      const { data, error } = await supabase
        .from('categorias_despesa')
        .update(rest)
        .eq('id', id)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data as ExpenseCategory;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenseCategories'] });
      queryClient.invalidateQueries({ queryKey: ['financialEntries'] });
    },
  });
};

export const useDeleteExpenseCategory = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation<void, Error, { id: string, entriesCount: number }>({
    mutationFn: async ({ id, entriesCount }) => {
      if (!user) throw new Error("Usuário não autenticado.");
      
      console.log(`[useDeleteExpenseCategory] Iniciando exclusão da categoria ID: ${id}`);
      console.log(`[useDeleteExpenseCategory] Contagem de lançamentos: ${entriesCount}`);
      
      // 1. Se houver lançamentos, migra-os
      if (entriesCount > 0) {
        try {
          console.log(`[useDeleteExpenseCategory] Garantindo categoria 'Sem Categoria'...`);
          const defaultCategoryId = await ensureDefaultCategoryExists(user.id);
          console.log(`[useDeleteExpenseCategory] Categoria 'Sem Categoria' ID: ${defaultCategoryId}`);
          
          console.log(`[useDeleteExpenseCategory] Migrando ${entriesCount} lançamentos...`);
          await migrateEntries(id, defaultCategoryId, user.id);
          console.log(`[useDeleteExpenseCategory] Migração concluída.`);
        } catch (migrateError) {
          console.error(`[useDeleteExpenseCategory] Erro durante a migração:`, migrateError);
          throw new Error(`Falha na migração: ${migrateError instanceof Error ? migrateError.message : "Erro desconhecido"}`);
        }
      }
      
      // 2. Deleta a categoria
      console.log(`[useDeleteExpenseCategory] Deletando categoria ID: ${id}...`);
      const { error: deleteError } = await supabase
        .from('categorias_despesa')
        .delete()
        .eq('id', id);
        
      if (deleteError) {
        console.error(`[useDeleteExpenseCategory] Erro ao deletar categoria:`, deleteError);
        throw new Error(`Falha ao deletar categoria: ${deleteError.message}`);
      }
      
      console.log(`[useDeleteExpenseCategory] Categoria deletada com sucesso.`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenseCategories'] });
      queryClient.invalidateQueries({ queryKey: ['financialEntries'] });
    },
    onError: (error) => {
      console.error("[useDeleteExpenseCategory] Erro na mutação:", error);
      // O toast de erro já é mostrado no componente
    }
  });
};