import { useObras } from "./use-obras";
import { useProfile } from "./use-profile";
import { FREE_PLAN_LIMIT } from "@/config/stripe";

export const useCanCreateObra = () => {
  const { data: profile, isLoading: isLoadingProfile } = useProfile();
  const { data: obras, isLoading: isLoadingObras } = useObras();

  const isPro = profile?.subscription_status === 'active';
  const obraCount = obras?.length || 0;
  
  const canCreate = isPro || obraCount < FREE_PLAN_LIMIT;

  return {
    canCreate,
    isPro,
    obraCount,
    isLoading: isLoadingProfile || isLoadingObras,
  };
};