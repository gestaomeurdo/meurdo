import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ExpenseCategory {
  id: string;
  nome: string;
  descricao: string | null;
}

// --- Fetching ---
const fetchExpenseCategories = async (): Promise<ExpenseCategory[]> => {
  const { data, error } = await supabase
    .from('categorias_despesa')
    .select('id, nome, descricao')
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
    staleTime: 1000 * 60 * 5, // Cache categories for 5 minutes
  });
};

// --- Mutations ---

interface CategoryInput {
  nome: string;
  descricao: string | null;
}

export const useCreateExpenseCategory = () => {
  const queryClient = useQueryClient();
  return useMutation<ExpenseCategory, Error, CategoryInput>({
    mutationFn: async (newCategory) => {
      const { data, error } = await supabase
        .from('categorias_despesa')
        .insert(newCategory)
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
  return useMutation<ExpenseCategory, Error, CategoryInput & { id: string }>({
    mutationFn: async (updatedCategory) => {
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
      queryClient.invalidateQueries({ queryKey: ['financialEntries'] }); // May affect existing entries display
    },
  });
};

export const useDeleteExpenseCategory = () => {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      const { error } = await supabase
        .from('categorias_despesa')
        .delete()
        .eq('id', id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenseCategories'] });
      queryClient.invalidateQueries({ queryKey: ['financialEntries'] });
    },
  });
};