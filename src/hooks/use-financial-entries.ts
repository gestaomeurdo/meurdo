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
  ignorar_soma: boolean; // Adicionado
  // Joined data (for display)
  categorias_despesa: ExpenseCategory;
  profiles: { first_name: string | null, last_name: string | null, email: string | null };
}

export interface FinancialEntriesResult {
  entries: FinancialEntry[];
  totalActivityCost: number;
  kmCost: number;
}

export interface FetchEntriesParams {
  obraId: string;
  startDate?: string;
  endDate?: string;
  categoryId?: string;
  paymentMethod?: PaymentMethod;
}

const fetchFinancialEntries = async ({ obraId, startDate, endDate, categoryId, paymentMethod }: FetchEntriesParams): Promise<FinancialEntriesResult> => {
  let query = supabase
    .from('lancamentos_financeiros')
    .select(`
      *,
      categorias_despesa (id, nome),
      profiles!user_id (first_name, last_name, email)
    `)
    .eq('obra_id', obraId)
    .order('data_gasto', { ascending: false });

  if (startDate) query = query.gte('data_gasto', startDate);
  if (endDate) query = query.lte('data_gasto', endDate);
  if (categoryId) query = query.eq('categoria_id', categoryId);
  if (paymentMethod) query = query.eq('forma_pagamento', paymentMethod);

  const { data: entriesData, error: entriesError } = await query;
  if (entriesError) throw new Error(entriesError.message);

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

  let kmCost = 1.50;
  const { data: kmCostData } = await supabase.from('configuracoes_globais').select('valor').eq('chave', 'custo_km_rodado').maybeSingle();
  if (kmCostData) kmCost = kmCostData.valor;

  const { data: activitiesData } = await supabase.from('atividades_obra').select('pedagio, km_rodado').eq('obra_id', obraId);

  let totalActivityCost = 0;
  if (activitiesData) {
    totalActivityCost = activitiesData.reduce((sum, activity) => {
      return sum + (activity.pedagio || 0) + ((activity.km_rodado || 0) * kmCost);
    }, 0);
  }

  return { entries, totalActivityCost, kmCost };
};

export const useFinancialEntries = (params: FetchEntriesParams) => {
  return useQuery<FinancialEntriesResult, Error>({
    queryKey: ['financialEntries', params],
    queryFn: () => fetchFinancialEntries(params),
    enabled: !!params.obraId,
    staleTime: 1000 * 60 * 1,
  });
};

export const useCreateFinancialEntry = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation<void, Error, any>({
    mutationFn: async (newEntry) => {
      const { error } = await supabase.from('lancamentos_financeiros').insert({ ...newEntry, user_id: user?.id });
      if (error) throw new Error(error.message);
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['financialEntries'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardData'] });
    },
  });
};

export const useUpdateFinancialEntry = () => {
  const queryClient = useQueryClient();
  return useMutation<void, Error, any>({
    mutationFn: async ({ id, ...rest }) => {
      const { error } = await supabase.from('lancamentos_financeiros').update(rest).eq('id', id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['financialEntries'] }),
  });
};

export const useDeleteFinancialEntry = () => {
  const queryClient = useQueryClient();
  return useMutation<void, Error, { id: string, obraId: string }>({
    mutationFn: async ({ id }) => {
      const { error } = await supabase.from('lancamentos_financeiros').delete().eq('id', id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['financialEntries'] }),
  });
};

export const useDeleteAllFinancialEntries = () => {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (obraId) => {
      const { error } = await supabase
        .from('lancamentos_financeiros')
        .delete()
        .eq('obra_id', obraId);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financialEntries'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardData'] });
    },
  });
};

export const useBulkUpdateCategory = () => {
  const queryClient = useQueryClient();
  return useMutation<void, Error, { ids: string[], categoria_id: string }>({
    mutationFn: async ({ ids, categoria_id }) => {
      const { error } = await supabase.from('lancamentos_financeiros').update({ categoria_id }).in('id', ids);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['financialEntries'] }),
  });
};

export const useBulkUpdateFinancialEntries = () => {
  const queryClient = useQueryClient();
  return useMutation<void, Error, { ids: string[], data_gasto?: string, forma_pagamento?: PaymentMethod, ignorar_soma?: boolean }>({
    mutationFn: async ({ ids, ...updateData }) => {
      const { error } = await supabase.from('lancamentos_financeiros').update(updateData).in('id', ids);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['financialEntries'] }),
  });
};