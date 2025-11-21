import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/integrations/supabase/auth-provider";
import { ExpenseCategory } from "./use-expense-categories";

export type PaymentMethod = 'Pix' | 'Dinheiro' | 'Cartão' | 'Boleto' | 'Transferência';

export interface FinancialEntry {
  id: string;
  obra_id: string;
  user_id: string;
  data_gasto: string; // Date string
  categoria_id: string;
  descricao: string;
  valor: number;
  forma_pagamento: PaymentMethod;
  documento_url: string | null;
  criado_em: string;
  // Joined data (for display)
  categorias_despesa: ExpenseCategory;
  profiles: { first_name: string | null, last_name: string | null, email: string | undefined };
}

// --- Fetching ---

interface FetchEntriesParams {
  obraId: string;
  startDate?: string;
  endDate?: string;
  categoryId?: string;
  paymentMethod?: PaymentMethod;
}

const fetchFinancialEntries = async ({ obraId, startDate, endDate, categoryId, paymentMethod }: FetchEntriesParams): Promise<FinancialEntry[]> => {
  let query = supabase
    .from('lancamentos_financeiros')
    .select(`
      *,
      categorias_despesa (id, nome),
      user:user_id (profiles (first_name, last_name, id))
    `)
    .eq('obra_id', obraId)
    .order('data_gasto', { ascending: false });

  if (startDate) {
    query = query.gte('data_gasto', startDate);
  }
  if (endDate) {
    query = query.lte('data_gasto', endDate);
  }
  if (categoryId) {
    query = query.eq('categoria_id', categoryId);
  }
  if (paymentMethod) {
    query = query.eq('forma_pagamento', paymentMethod);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }
  
  // Map user data from profiles join
  const entries = data.map(entry => {
    // The join structure is complex: lancamentos_financeiros -> auth.users (aliased as 'user') -> profiles
    // We need to extract the profile data from the nested structure
    const profileData = (entry as any).user?.profiles?.[0] || {};

    return {
      ...entry,
      profiles: {
        first_name: profileData.first_name,
        last_name: profileData.last_name,
        email: profileData.id ? profileData.id : undefined, // Using ID as placeholder for email
      }
    }
  }) as FinancialEntry[];

  return entries;
};

export const useFinancialEntries = (params: FetchEntriesParams) => {
  return useQuery<FinancialEntry[], Error>({
    queryKey: ['financialEntries', params],
    queryFn: () => fetchFinancialEntries(params),
    enabled: !!params.obraId,
  });
};

// --- Mutations ---

interface FinancialEntryInput {
  obra_id: string;
  data_gasto: string; // YYYY-MM-DD
  categoria_id: string;
  descricao: string;
  valor: number;
  forma_pagamento: PaymentMethod;
  documento_url?: string | null;
}

export const useCreateFinancialEntry = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const userId = user?.id;

  return useMutation<FinancialEntry, Error, FinancialEntryInput>({
    mutationFn: async (newEntry) => {
      if (!userId) throw new Error("User not authenticated.");
      
      const { data, error } = await supabase
        .from('lancamentos_financeiros')
        .insert({ ...newEntry, user_id: userId })
        .select(`
          *,
          categorias_despesa (id, nome),
          user:user_id (profiles (first_name, last_name, id))
        `)
        .single();

      if (error) {
        throw new Error(error.message);
      }
      
      // Manually map the nested profile data for the return type
      const profileData = (data as any).user?.profiles?.[0] || {};
      
      return {
        ...data,
        profiles: {
          first_name: profileData.first_name,
          last_name: profileData.last_name,
          email: profileData.id ? profileData.id : undefined,
        }
      } as FinancialEntry;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['financialEntries', { obraId: data.obra_id }] });
      queryClient.invalidateQueries({ queryKey: ['dashboardMetrics'] }); // Update dashboard totals
    },
  });
};

export const useUpdateFinancialEntry = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const userId = user?.id;

  return useMutation<FinancialEntry, Error, FinancialEntryInput & { id: string }>({
    mutationFn: async (updatedEntry) => {
      if (!userId) throw new Error("User not authenticated.");

      const { data, error } = await supabase
        .from('lancamentos_financeiros')
        .update(updatedEntry)
        .eq('id', updatedEntry.id)
        .eq('user_id', userId) // Ensure user can only update their own
        .select(`
          *,
          categorias_despesa (id, nome),
          user:user_id (profiles (first_name, last_name, id))
        `)
        .single();

      if (error) {
        throw new Error(error.message);
      }
      
      // Manually map the nested profile data for the return type
      const profileData = (data as any).user?.profiles?.[0] || {};
      
      return {
        ...data,
        profiles: {
          first_name: profileData.first_name,
          last_name: profileData.last_name,
          email: profileData.id ? profileData.id : undefined,
        }
      } as FinancialEntry;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['financialEntries', { obraId: data.obra_id }] });
      queryClient.invalidateQueries({ queryKey: ['dashboardMetrics'] });
    },
  });
};

export const useDeleteFinancialEntry = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const userId = user?.id;

  return useMutation<void, Error, { id: string, obraId: string }>({
    mutationFn: async ({ id }) => {
      if (!userId) throw new Error("User not authenticated.");

      const { error } = await supabase
        .from('lancamentos_financeiros')
        .delete()
        .eq('id', id)
        .eq('user_id', userId); // Ensure user can only delete their own

      if (error) {
        throw new Error(error.message);
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['financialEntries', { obraId: variables.obraId }] });
      queryClient.invalidateQueries({ queryKey: ['dashboardMetrics'] });
    },
  });
};