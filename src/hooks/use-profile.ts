import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/integrations/supabase/auth-provider";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as z from "zod";

// Schema centralizado para garantir que o Frontend aceite os dados do Supabase
export const ProfileSchema = z.object({
  id: z.string(),
  first_name: z.string().nullish(),
  last_name: z.string().nullish(),
  avatar_url: z.string().nullish(),
  role: z.enum(['administrator', 'obra_user', 'view_only']).default('obra_user'),
  subscription_status: z.enum(['active', 'trialing', 'past_due', 'canceled', 'unpaid', 'free']).nullish().default('free'),
  plan_type: z.string().nullish().default('free'),
  stripe_customer_id: z.string().nullish(),
});

export type Profile = z.infer<typeof ProfileSchema>;

export const fetchProfile = async (userId: string): Promise<Profile | null> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, avatar_url, role, subscription_status, stripe_customer_id, plan_type')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error("[fetchProfile] Erro Supabase:", error.message);
      return null;
    }

    if (!data) return null;

    // Força os valores padrão antes da validação para evitar rejeição
    const rawProfile = {
      ...data,
      subscription_status: data.subscription_status || 'free',
      plan_type: data.plan_type || 'free',
      role: data.role || 'obra_user'
    };

    // Valida com Zod
    const validation = ProfileSchema.safeParse(rawProfile);
    
    if (!validation.success) {
      console.error("[fetchProfile] Falha na validação Zod:", validation.error.format());
      // Retorna o objeto cru como fallback para não travar o app
      return rawProfile as Profile;
    }

    return validation.data;
  } catch (err) {
    console.error("[fetchProfile] Falha catastrófica:", err);
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