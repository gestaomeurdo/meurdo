import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/integrations/supabase/auth-provider";

export interface ChartData {
  name: string;
  Orçamento: number;
  Gasto: number;
}

interface DashboardData {
  activeObrasCount: number;
  totalInitialBudget: number;
  chartData: ChartData[];
}

const fetchDashboardData = async (userId: string): Promise<DashboardData> => {
  // 1. Fetch all obras for the user
  const { data: obras, error: obrasError } = await supabase
    .from('obras')
    .select('id, nome, status, orcamento_inicial')
    .eq('user_id', userId);

  if (obrasError) {
    throw new Error(obrasError.message);
  }

  if (!obras || obras.length === 0) {
    return {
      activeObrasCount: 0,
      totalInitialBudget: 0,
      chartData: [],
    };
  }

  // 2. Fetch all financial entries for the user's obras
  const { data: entries, error: entriesError } = await supabase
    .from('lancamentos_financeiros')
    .select('obra_id, valor')
    .in('obra_id', obras.map(o => o.id));

  if (entriesError) {
    throw new Error(entriesError.message);
  }

  // 3. Process metrics
  const activeObrasCount = obras.filter(obra => obra.status === 'ativa').length;
  const totalInitialBudget = obras.reduce((sum, obra) => sum + (obra.orcamento_inicial || 0), 0);

  // 4. Process chart data
  const expensesByObra = entries.reduce((acc, entry) => {
    if (entry.obra_id) {
      acc[entry.obra_id] = (acc[entry.obra_id] || 0) + entry.valor;
    }
    return acc;
  }, {} as Record<string, number>);

  const chartData = obras.map(obra => ({
    name: obra.nome,
    Orçamento: obra.orcamento_inicial || 0,
    Gasto: expensesByObra[obra.id] || 0,
  }));

  return {
    activeObrasCount,
    totalInitialBudget,
    chartData,
  };
};

export const useDashboardData = () => {
  const { user } = useAuth();
  const userId = user?.id;

  return useQuery<DashboardData, Error>({
    queryKey: ['dashboardData', userId],
    queryFn: () => fetchDashboardData(userId!),
    enabled: !!userId,
    staleTime: 1000 * 60 * 1, // 1 minute
  });
};