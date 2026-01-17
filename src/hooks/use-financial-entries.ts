import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/integrations/supabase/auth-provider";
import { ExpenseCategory } from "./use-expense-categories";

export type PaymentMethod = 'Pix' | 'Dinheiro' | 'Cartão' | 'Boleto' | 'Transferência';

export interface FinancialEntry {
  id: string;
  obra_id: string;
  user_id: string;
  data_gasto: string; 
  categoria_id: string;
  descricao: string;
  valor: number;
  forma_pagamento: PaymentMethod;
  documento_url: string | null;
  criado_em: string;
  ignorar_soma: boolean;
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
  if (!obraId) return { entries: [], totalActivityCost: 0, kmCost: 1.50 };

  console.log("[useFinancialEntries] Buscando dados para obra:", obraId);

  // 1. Busca Lançamentos com Joins
  let query = supabase
    .from('lancamentos_financeiros')
    .select(`
      *,
      categorias_despesa (id, nome),
      profiles (first_name, last_name)
    `)
    .eq('obra_id', obraId)
    .order('data_gasto', { ascending: false });

  if (startDate) query = query.gte('data_gasto', startDate);
  if (endDate) query = query.lte('data_gasto', endDate);
  if (categoryId) query = query.eq('categoria_id', categoryId);
  if (paymentMethod) query = query.eq('forma_pagamento', paymentMethod);

  const { data: entriesData, error: entriesError } = await query;
  
  if (entriesError) {
    console.error("[useFinancialEntries] Erro ao buscar lançamentos:", entriesError);
    throw new Error(entriesError.message);
  }

  // 2. Busca Custo do KM (Configuração Global)
  let kmCost = 1.50;
  try {
    const { data: kmCostData } = await supabase
      .from('configuracoes_globais')
      .select('valor')
      .eq('chave', 'custo_km_rodado')
      .maybeSingle();
    
    if (kmCostData) kmCost = kmCostData.valor;
  } catch (e) {
    console.warn("[useFinancialEntries] Falha ao buscar custo_km_rodado, usando padrão 1.50");
  }

  // 3. Busca Atividades para calcular custo de deslocamento
  let totalActivityCost = 0;
  try {
    const { data: activitiesData } = await supabase
      .from('atividades_obra')
      .select('pedagio, km_rodado')
      .eq('obra_id', obraId);

    if (activitiesData) {
      totalActivityCost = activitiesData.reduce((sum, activity) => {
        return sum + (Number(activity.pedagio) || 0) + ((Number(activity.km_rodado) || 0) * kmCost);
      }, 0);
    }
  } catch (e) {
    console.warn("[useFinancialEntries] Falha ao calcular custo de atividades");
  }

  const entries = (entriesData || []).map(entry => ({
    ...entry,
    profiles: entry.profiles ? {
      first_name: entry.profiles.first_name,
      last_name: entry.profiles.last_name,
      email: null,
    } : { first_name: 'N/A', last_name: '', email: null }
  })) as FinancialEntry[];

  return { entries, totalActivityCost, kmCost };
};

export const useFinancialEntries = (params: FetchEntriesParams) => {
  return useQuery<FinancialEntriesResult, Error>({
    queryKey: ['financialEntries', params],
    queryFn: () => fetchFinancialEntries(params),
    enabled: !!params.obraId,
    staleTime: 1000 * 60 * 1,
    retry: 1,
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
    onSuccess: () => {
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
      const { error } = await supabase
        .from('lancamentos_financeiros')
        .update({ categoria_id })
        .in('id', ids);

      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financialEntries'] });
    },
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