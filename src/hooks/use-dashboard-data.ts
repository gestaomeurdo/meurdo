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

const fetchDashboardData = async (): Promise<DashboardData> => {
  const { data, error } = await supabase.functions.invoke('dashboard-metrics');

  if (error) {
    throw new Error(`Error fetching dashboard metrics: ${error.message}`);
  }

  return data;
};

export const useDashboardData = () => {
  const { user } = useAuth();
  const userId = user?.id;

  return useQuery<DashboardData, Error>({
    queryKey: ['dashboardData', userId], // Keep userId in key to refetch on user change
    queryFn: fetchDashboardData,
    enabled: !!userId,
    staleTime: 1000 * 60 * 1, // 1 minute
  });
};