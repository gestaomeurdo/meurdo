import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/integrations/supabase/auth-provider";
import { useMutation, useQueryClient } from "@tanstack/react-query";

// Interface resiliente para o Perfil
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
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, avatar_url, role, subscription_status, stripe_customer_id, plan_type')
      .eq('id', userId)
      .maybeSingle(); // Usar maybeSingle para evitar erro se não encontrar

    if (error) {
      console.error("[fetchProfile] Erro na busca:", error.message);
      return null;
    }
    
    // Fallback para valores padrão caso venham nulos do banco
    return {
      ...data,
      subscription_status: data?.subscription_status || 'free',
      plan_type: data?.plan_type || 'free',
      role: data?.role || 'obra_user'
    } as Profile;
  } catch (err) {
    console.error("[fetchProfile] Falha crítica:", err);
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