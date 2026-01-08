import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/integrations/supabase/auth-provider";
import { ensureDefaultCategoryExists, migrateEntries } from "@/utils/category-migration";

export interface ExpenseCategory {
  id: string;
  nome: string;
  descricao: string | null;
  user_id?: string | null; // Adicionado user_id
}

// --- Fetching ---
const fetchExpenseCategories = async (): Promise<ExpenseCategory[]> => {
  const { data, error } = await supabase
    .from('categorias_despesa')
    .select('id, nome, descricao, user_id') // Incluindo user_id na busca
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
  const { user } = useAuth(); // Usando useAuth para obter o user

  return useMutation<ExpenseCategory, Error, CategoryInput>({
    mutationFn: async (newCategory) => {
      if (!user) throw new Error("Usuário não autenticado.");
      
      const { data, error } = await supabase
        .from('categorias_despesa')
        .insert({ ...newCategory, user_id: user.id }) // Adicionando user_id
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
      queryClient.invalidateQueries({ queryKey: ['financialEntries'] }); // May affect existing entries display
    },
  });
};

export const useDeleteExpenseCategory = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation<void, Error, { id: string, entriesCount: number }>({
    mutationFn: async ({ id, entriesCount }) => {
      if (!user) throw new Error("Usuário não autenticado.");
      
      if (entriesCount > 0) {
        // 1. Garante que a categoria padrão exista
        const defaultCategoryId = await ensureDefaultCategoryExists(user.id);
        
        // 2. Migra os lançamentos
        await migrateEntries(id, defaultCategoryId, user.id);
      }
      
      // 3. Deleta a categoria (agora sem referências de chave estrangeira)
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