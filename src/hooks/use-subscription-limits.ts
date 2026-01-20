import { useObras } from "./use-obras";
import { useProfile } from "./use-profile";
import { useAuth } from "@/integrations/supabase/auth-provider";

export const FREE_PLAN_LIMITS = {
    OBRAS: 1,
    PHOTOS_PER_RDO: 5
};

const ADMIN_EMAIL = 'robsonalixandree@gmail.com';

export const useSubscriptionLimits = () => {
  const { data: profile, isLoading: isLoadingProfile } = useProfile();
  const { data: obras, isLoading: isLoadingObras } = useObras();
  const { user, isPro: authIsPro } = useAuth();

  // 1. Prioridade absoluta: Se for o Robson ou se o contexto de Auth já marcou como Pro
  const isRobson = user?.email === ADMIN_EMAIL || profile?.role === 'administrator';
  
  // 2. Verificação robusta de Pro
  const isPro = 
    isRobson || 
    authIsPro || 
    profile?.subscription_status === 'active' || 
    profile?.plan_type === 'pro' || 
    profile?.plan_type === 'premium';
  
  const obraCount = obras?.length || 0;
  
  // Se for Pro/Robson, sempre pode criar. Se não, respeita o limite de 1.
  const canCreateObra = isPro || obraCount < FREE_PLAN_LIMITS.OBRAS;

  return {
    isPro,
    canCreateObra,
    obraCount,
    limits: FREE_PLAN_LIMITS,
    isLoading: isLoadingProfile || isLoadingObras
  };
};

export const useCanCreateObra = useSubscriptionLimits;