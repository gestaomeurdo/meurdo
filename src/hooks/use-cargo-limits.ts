import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/integrations/supabase/auth-provider";
import { useCargos } from "./use-cargos";

const FREE_CARGO_LIMIT = 5;

export const useCargoLimits = () => {
  const { profile, isLoading: isLoadingProfile } = useAuth();
  const { data: cargos, isLoading: isLoadingCargos } = useCargos();

  const isPro = profile?.subscription_status === 'active' || profile?.plan_type === 'pro';
  const cargoCount = cargos?.length || 0;
  
  const canCreateCargo = isPro || cargoCount < FREE_CARGO_LIMIT;

  return {
    canCreateCargo,
    isPro,
    cargoCount,
    limit: FREE_CARGO_LIMIT,
    isLoading: isLoadingProfile || isLoadingCargos,
  };
};