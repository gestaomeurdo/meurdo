import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/integrations/supabase/auth-provider";

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