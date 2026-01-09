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
  profiles: { first_name: string | null, last_name: string | null, email: string | null };
}

// Novo tipo de retorno para incluir métricas de atividade
export interface FinancialEntriesResult {
  entries: FinancialEntry[];
  totalActivityCost: number;
  kmCost: number;
}

// --- Fetching ---

interface FetchEntriesParams {
  obraId: string;
  startDate?: string;
  endDate?: string;
  categoryId?: string;
  paymentMethod?: PaymentMethod;
}

const fetchFinancialEntries = async ({ obraId, startDate, endDate, categoryId, paymentMethod }: FetchEntriesParams): Promise<FinancialEntriesResult> => {
  // 1. Fetch Financial Entries
  let query = supabase
    .from('lancamentos_financeiros')
    .select(`
      *,
      categorias_despesa (id, nome),
      profiles!user_id (first_name, last_name, email)
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

  const { data: entriesData, error: entriesError } = await query;

  if (entriesError) {
    throw new Error(entriesError.message);
  }
  
  const entries = entriesData.map(entry => {
    const profileData = (entry as any).profiles || {};

    return {
      ...entry,
      profiles: {
        first_name: profileData.first_name,
        last_name: profileData.last_name,
        email: profileData.email,
      }
    }
  }) as FinancialEntry[];

  // 2. Fetch KM Cost
  const { data: kmCostData } = await supabase
    .from('configuracoes_globais')
    .select('valor')
    .eq('chave', 'custo_km_rodado')
    .single()
    .catch(() => ({ data: null })); // Handle potential error gracefully

  const kmCost = kmCostData?.valor ?? 1.50;

  // 3. Calculate Total Activity Cost (KM + Pedágio)
  const { data: activitiesData, error: activitiesError } = await supabase
    .from('atividades_obra')
    .select('pedagio, km_rodado')
    .eq('obra_id', obraId);

  if (activitiesError) {
    console.error("Error fetching activities for cost calculation:", activitiesError);
    // Proceed with 0 cost if fetching activities fails
  }
  
  let totalActivityCost = 0;
  if (activitiesData) {
    totalActivityCost = activitiesData.reduce((sum, activity) => {
      const pedagio = activity.pedagio || 0;
      const kmRodadoCost = (activity.km_rodado || 0) * kmCost;
      return sum + pedagio + kmRodadoCost;
    }, 0);
  }

  return { entries, totalActivityCost, kmCost };
};

export const useFinancialEntries = (params: FetchEntriesParams) => {
  return useQuery<FinancialEntriesResult, Error>({
    queryKey: ['financialEntries', params],
    queryFn: () => fetchFinancialEntries(params),
    enabled: !!params.obraId,
    staleTime: 1000 * 60 * 1, // Cache data for 1 minute
  });
};

// --- Mutations (kept the same, only updating types) ---

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

  return useMutation<void, Error, FinancialEntryInput>({
    mutationFn: async (newEntry) => {
      if (!userId) throw new Error("User not authenticated.");
      
      const { error } = await supabase
        .from('lancamentos_financeiros')
        .insert({ ...newEntry, user_id: userId });

      if (error) {
        throw new Error(error.message);
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['financialEntries', { obraId: variables.obra_id }] });
      queryClient.invalidateQueries({ queryKey: ['dashboardData'] });
    },
  });
};

export const useUpdateFinancialEntry = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const userId = user?.id;

  return useMutation<void, Error, FinancialEntryInput & { id: string }>({
    mutationFn: async (updatedEntry) => {
      if (!userId) throw new Error("User not authenticated.");
      const { id, ...rest } = updatedEntry;

      const { error } = await supabase
        .from('lancamentos_financeiros')
        .update(rest)
        .eq('id', id);

      if (error) {
        throw new Error(error.message);
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['financialEntries', { obraId: variables.obra_id }] });
      queryClient.invalidateQueries({ queryKey: ['dashboardData'] });
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
        .eq('id', id);

      if (error) {
        throw new Error(error.message);
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['financialEntries', { obraId: variables.obra_id }] });
      queryClient.invalidateQueries({ queryKey: ['dashboardData'] });
    },
  });
};

interface BulkUpdateCategoryInput {
  ids: string[];
  categoria_id: string;
}

export const useBulkUpdateCategory = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const userId = user?.id;

  return useMutation<void, Error, BulkUpdateCategoryInput>({
    mutationFn: async ({ ids, categoria_id }) => {
      if (!userId) throw new Error("User not authenticated.");
      if (ids.length === 0) return;

      const { error } = await supabase
        .from('lancamentos_financeiros')
        .update({ categoria_id })
        .in('id', ids);

      if (error) {
        throw new Error(error.message);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financialEntries'] });
    },
  });
};

interface BulkUpdateInput {
  ids: string[];
  data_gasto?: string; // YYYY-MM-DD
  forma_pagamento?: PaymentMethod;
}

export const useBulkUpdateFinancialEntries = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const userId = user?.id;

  return useMutation<void, Error, BulkUpdateInput>({
    mutationFn: async ({ ids, ...updateData }) => {
      if (!userId) throw new Error("User not authenticated.");
      if (ids.length === 0) return;

      const payload: Partial<Omit<BulkUpdateInput, 'ids'>> = Object.fromEntries(
        Object.entries(updateData).filter(([, value]) => value !== undefined)
      );

      if (Object.keys(payload).length === 0) {
        throw new Error("Nenhum campo para atualizar foi fornecido.");
      }

      const { error } = await supabase
        .from('lancamentos_financeiros')
        .update(payload)
        .in('id', ids);

      if (error) {
        throw new Error(error.message);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financialEntries'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardData'] });
    },
  });
};