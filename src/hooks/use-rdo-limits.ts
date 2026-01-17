import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/integrations/supabase/auth-provider";
import { FREE_PLAN_LIMIT } from "@/config/stripe"; // Reusing the limit constant for consistency, though we'll define a new one for RDOs

// Define RDO specific limit
const FREE_RDO_LIMIT = 3;

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
  
  const isPro = profile?.subscription_status === 'active';

  const { data: rdoCount, isLoading: isLoadingCount } = useQuery<number, Error>({
    queryKey: ['rdoCount', userId],
    queryFn: () => fetchRdoCount(userId!),
    enabled: !!userId && !isPro, // Only fetch count if user is Free
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