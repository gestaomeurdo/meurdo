import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/integrations/supabase/auth-provider";
import { useMutation, useQueryClient } from "@tanstack/react-query";

// Mantendo apenas a interface para o TS não reclamar
export interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  role: 'administrator' | 'obra_user' | 'view_only';
  subscription_status: string | null;
  stripe_customer_id: string | null;
  plan_type: string | null;
}

export const fetchProfile = async (userId: string): Promise<Profile | null> => {
  console.log("[DEBUG] Iniciando fetchProfile para:", userId);
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*') // Buscando tudo para debug
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error("[DEBUG] Erro Supabase no fetchProfile:", error);
      return null;
    }

    console.log("[DEBUG] Dados brutos recebidos do Supabase:", data);
    
    // RETORNANDO DADOS BRUTOS SEM VALIDAÇÃO ZOD
    return data as any;
  } catch (err) {
    console.error("[DEBUG] Falha catastrófica no fetchProfile:", err);
    return null;
  }
};

export const useProfile = () => {
  const { profile, isLoading } = useAuth();
  return { data: profile, isLoading };
};

interface ProfileUpdateInput {
  first_name: string;
  last_name: string;
}

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation<void, Error, ProfileUpdateInput>({
    mutationFn: async (updates) => {
      if (!user) throw new Error("Usuário não autenticado.");

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
};