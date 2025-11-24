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

// This function now calls a database function (RPC) for much better performance.
// The database will do the heavy lifting of calculating metrics.
const fetchDashboardData = async (userId: string): Promise<DashboardData> => {
  const { data, error } = await supabase.rpc('get_dashboard_data', {
    p_user_id: userId,
  });

  if (error) {
    console.error("Error fetching dashboard data:", error);
    throw new Error(error.message);
  }

  // The RPC returns the data in the exact shape we need.
  // If no obras exist, it might return null fields, so we provide defaults.
  return {
    activeObrasCount: data.activeObrasCount ?? 0,
    totalInitialBudget: data.totalInitialBudget ?? 0,
    chartData: data.chartData ?? [],
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