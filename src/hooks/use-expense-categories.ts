import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/integrations/supabase/auth-provider";

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
    staleTime: 1000 * 60 * 5, 
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

  return useMutation<void, Error, CategoryInput>({
    mutationFn: async (newCategory) => {
      if (!user) throw new Error("Usuário não autenticado.");
      
      const { error } = await supabase
        .from('categorias_despesa')
        .insert({ ...newCategory, user_id: user.id });
        
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenseCategories'] });
    },
  });
};

export const useUpdateExpenseCategory = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation<void, Error, CategoryInput & { id: string }>({
    mutationFn: async (updatedCategory) => {
      if (!user) throw new Error("Usuário não autenticado.");
      const { id, ...rest } = updatedCategory;
      
      const { error } = await supabase
        .from('categorias_despesa')
        .update(rest)
        .eq('id', id);

      if (error) throw new Error(error.message);
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

  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      if (!user) throw new Error("Usuário não autenticado.");
      
      const { error } = await supabase
        .from('categorias_despesa')
        .delete()
        .eq('id', id);
        
      if (error) {
        throw new Error(error.message);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenseCategories'] });
      queryClient.invalidateQueries({ queryKey: ['financialEntries'] });
    },
  });
};