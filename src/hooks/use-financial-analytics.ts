import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface FinancialAnalyticsData {
  summary: {
    orcamentoInicial: number;
    totalGasto: number;
    saldoDisponivel: number;
    percentualUsado: number;
  };
  charts: {
    categoryData: { name: string; value: number }[];
    monthlyData: { name: string; Gasto: number }[];
  };
}

const fetchFinancialAnalytics = async (obraId: string): Promise<FinancialAnalyticsData> => {
  const { data, error } = await supabase.functions.invoke('financial-analytics', {
    body: { obraId },
  });

  if (error) {
    throw new Error(`Error fetching financial analytics: ${error.message}`);
  }

  return data;
};

export const useFinancialAnalytics = (obraId: string | undefined) => {
  return useQuery<FinancialAnalyticsData, Error>({
    queryKey: ['financialAnalytics', obraId],
    queryFn: () => fetchFinancialAnalytics(obraId!),
    enabled: !!obraId,
  });
};