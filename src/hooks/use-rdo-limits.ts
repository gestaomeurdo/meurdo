import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/integrations/supabase/auth-provider";

// Define RDO specific limit as requested by user
const FREE_RDO_LIMIT = 2;

interface RdoLimitData {
  rdoCount: number;
  limit: number;
  canCreateRdo: boolean;
  isPro: boolean;
  isLoading: boolean;
}

const fetchRdoCount = async (userId: string): Promise<number> => {
  const { count, error } = await supabase
    .from('diarios_obra')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId);

  if (error) {
    console.error("Error fetching RDO count:", error);
    throw new Error(error.message);
  }
  return count ?? 0;
};

export const useRdoLimits = () => {
  const { user, profile, isLoading: isLoadingAuth } = useAuth();
  const userId = user?.id;
  
  const isPro = profile?.subscription_status === 'active' || profile?.plan_type === 'pro';

  const { data: rdoCount, isLoading: isLoadingCount } = useQuery<number, Error>({
    queryKey: ['rdoCount', userId],
    queryFn: () => fetchRdoCount(userId!),
    enabled: !!userId, // Always fetch to show progress even if PRO
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const currentRdoCount = rdoCount ?? 0;
  const limit = FREE_RDO_LIMIT;
  
  const canCreateRdo = isPro || currentRdoCount < limit;

  return {
    rdoCount: currentRdoCount,
    limit,
    canCreateRdo,
    isPro,
    isLoading: isLoadingAuth || isLoadingCount,
  } as RdoLimitData;
};