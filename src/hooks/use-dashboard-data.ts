import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/integrations/supabase/auth-provider";

interface DashboardMetrics {
  activeObrasCount: number;
  totalInitialBudget: number;
}

const fetchDashboardMetrics = async (userId: string): Promise<DashboardMetrics> => {
  // 1. Fetch all obras for the user
  const { data: obras, error } = await supabase
    .from('obras')
    .select('status, orcamento_inicial')
    .eq('user_id', userId);

  if (error) {
    throw new Error(error.message);
  }

  let activeObrasCount = 0;
  let totalInitialBudget = 0;

  obras.forEach(obra => {
    if (obra.status === 'ativa') {
      activeObrasCount += 1;
    }
    totalInitialBudget += obra.orcamento_inicial || 0;
  });

  return {
    activeObrasCount,
    totalInitialBudget,
  };
};

export const useDashboardMetrics = () => {
  const { user } = useAuth();
  const userId = user?.id;

  return useQuery<DashboardMetrics, Error>({
    queryKey: ['dashboardMetrics', userId],
    queryFn: () => fetchDashboardMetrics(userId!),
    enabled: !!userId,
    staleTime: 1000 * 60 * 1, // 1 minute
  });
};