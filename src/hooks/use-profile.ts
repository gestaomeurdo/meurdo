import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/integrations/supabase/auth-provider";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  role: 'administrator' | 'obra_user' | 'view_only';
}

export const fetchProfile = async (userId: string): Promise<Profile | null> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, avatar_url, role')
    .eq('id', userId)
    .single();

  if (error) {
    console.error("Error fetching profile:", error.message);
    // Return null instead of throwing, so the app doesn't crash if profile is missing
    return null;
  }
  
  if (!data) return null;

  const role = data.role as Profile['role'];
  return { ...data, role };
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
      // Invalidate the profile query to refetch the updated data
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
};