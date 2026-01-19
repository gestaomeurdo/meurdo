import { useObras } from "./use-obras";
import { useProfile } from "./use-profile";

export const FREE_PLAN_LIMITS = {
    OBRAS: 1,
    PHOTOS_PER_RDO: 5
};

export const useSubscriptionLimits = () => {
  const { data: profile } = useProfile();
  const { data: obras } = useObras();

  const isPro = profile?.subscription_status === 'active' || profile?.plan_type === 'pro';
  const obraCount = obras?.length || 0;
  
  const canCreateObra = isPro || obraCount < FREE_PLAN_LIMITS.OBRAS;

  return {
    isPro,
    canCreateObra,
    obraCount,
    limits: FREE_PLAN_LIMITS
  };
};