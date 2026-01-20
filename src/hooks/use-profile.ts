import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/integrations/supabase/auth-provider";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import * as z from "zod";
import { showError } from "@/utils/toast";

export const ProfileSchema = z.object({
  id: z.string(),
  first_name: z.string().nullish(),
  last_name: z.string().nullish(),
  company_name: z.string().nullish(),
  cnpj: z.string().nullish(),
  address: z.string().nullish(), // Novo campo
  avatar_url: z.string().nullish(),
  role: z.enum(['administrator', 'obra_user', 'view_only']).default('obra_user'),
  subscription_status: z.enum([
    'active', 
    'trialing', 
    'past_due', 
    'canceled', 
    'incomplete', 
    'incomplete_expired', 
    'free'
  ]).nullable().default('free'),
  plan_type: z.string().nullable().default('free'),
  stripe_customer_id: z.string().nullish(),
});

export type Profile = z.infer<typeof ProfileSchema>;

export const fetchProfile = async (userId: string): Promise<Profile | null> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) return null;
    if (!data) return null;

    const result = ProfileSchema.safeParse(data);
    return result.success ? result.data : (data as Profile);
  } catch (err) {
    return null;
  }
};

export const useProfile = () => {
  const { profile, isLoading } = useAuth();
  return { data: profile, isLoading };
};

interface ProfileUpdateInput {
  first_name?: string;
  last_name?: string;
  company_name?: string | null;
  cnpj?: string | null;
  address?: string | null; // Novo campo
}

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation<void, Error, ProfileUpdateInput>({
    mutationFn: async (updates) => {
      if (!user) throw new Error("Usuário não autenticado.");
      const { error } = await supabase.from('profiles').update(updates).eq('id', user.id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
};

export const useStripeCustomerPortal = () => {
  const { user } = useAuth();
  return useMutation<void, Error, void>({
    mutationFn: async () => {
      if (!user) throw new Error("Usuário não autenticado.");
      const { data, error } = await supabase.functions.invoke('create-customer-portal-session', {
        body: { returnUrl: `${window.location.origin}/settings` },
      });
      if (error) throw error;
      if (data?.url) window.location.href = data.url;
    },
    onError: (error) => showError(`Erro ao acessar o portal: ${error.message}`)
  });
};