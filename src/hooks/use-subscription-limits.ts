import { useObras } from "./use-obras";
import { useProfile } from "./use-profile";
import { useAuth } from "@/integrations/supabase/auth-provider";

export const FREE_PLAN_LIMITS = {
    OBRAS: 1,
    PHOTOS_PER_RDO: 5
};

const ADMIN_EMAIL = 'robsonalixandree@gmail.com';

export const useCanCreateObra = () => {
  const { data: profile, isLoading: isLoadingProfile } = useProfile();
  const { data: obras, isLoading: isLoadingObras } = useObras();
  const { user } = useAuth();

  // REGRA DE OURO: Robson ignora todos os limites
  const isRobson = user?.email === ADMIN_EMAIL || profile?.role === 'administrator';
  const isPro = isRobson || profile?.subscription_status === 'active' || profile?.plan_type === 'pro';
  
  const obraCount = obras?.length || 0;
  
  const canCreateObra = isPro || obraCount < FREE_PLAN_LIMITS.OBRAS;

  return {
    isPro,
    canCreateObra,
    obraCount,
    limits: FREE_PLAN_LIMITS,
    isLoading: isLoadingProfile || isLoadingObras
  };
};

export const useSubscriptionLimits = useCanCreateObra;