import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const KM_COST_KEY = 'custo_km_rodado';

interface KmCostConfig {
  chave: string;
  valor: number;
  descricao: string | null;
}

const fetchKmCost = async (): Promise<number> => {
  const { data, error } = await supabase
    .from('configuracoes_globais')
    .select('valor')
    .eq('chave', KM_COST_KEY)
    .single();

  if (error) {
    // If the key doesn't exist, default to 1.50
    if (error.code === 'PGRST116') { 
      return 1.50;
    }
    throw new Error(error.message);
  }
  
  return data?.valor ?? 1.50;
};

export const useKmCost = () => {
  return useQuery<number, Error>({
    queryKey: ['kmCost'],
    queryFn: fetchKmCost,
    staleTime: Infinity, // Assume this changes rarely
  });
};

export const useUpdateKmCost = () => {
  const queryClient = useQueryClient();

  return useMutation<KmCostConfig, Error, number>({
    mutationFn: async (newCost) => {
      const { data, error } = await supabase
        .from('configuracoes_globais')
        .upsert({ 
          chave: KM_COST_KEY, 
          valor: newCost,
          descricao: 'Custo por quilômetro rodado (R$) para cálculo de despesas de atividade.'
        }, { onConflict: 'chave' })
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }
      return data as KmCostConfig;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kmCost'] });
      // Invalidate RDO report data as the calculation depends on this cost
      queryClient.invalidateQueries({ queryKey: ['rdoReportData'] }); 
    },
  });
};