import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ExpenseCategory {
  id: string;
  nome: string;
  descricao: string | null;
}

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
    staleTime: Infinity, // Categories rarely change
  });
};