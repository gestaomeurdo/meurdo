import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/integrations/supabase/auth-provider";

export interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  role: 'administrator' | 'obra_user' | 'view_only';
}

const fetchProfile = async (userId: string): Promise<Profile> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, avatar_url, role')
    .eq('id', userId)
    .single();

  if (error) {
    throw new Error(error.message);
  }
  
  // Ensure role is one of the expected types, defaulting if necessary
  const role = data.role as Profile['role'];

  return { ...data, role };
};

export const useProfile = () => {
  const { user, session } = useAuth();
  const userId = user?.id;

  return useQuery<Profile, Error>({
    queryKey: ['profile', userId],
    queryFn: () => fetchProfile(userId!),
    enabled: !!userId && !!session,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};