import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Profile } from "./use-profile";

export interface UserWithAccess extends Profile {
  obra_access: { obra_id: string }[];
}

// --- Fetching ---
const fetchUsers = async (): Promise<UserWithAccess[]> => {
  const { data, error } = await supabase
    .from('profiles')
    .select(`
      *,
      obra_user_access ( obra_id )
    `);

  if (error) {
    throw new Error(error.message);
  }
  return data as UserWithAccess[];
};

export const useUsers = () => {
  return useQuery<UserWithAccess[], Error>({
    queryKey: ['users'],
    queryFn: fetchUsers,
  });
};

// --- Mutations ---

// Update user role
export const useUpdateUserRole = () => {
  const queryClient = useQueryClient();
  return useMutation<Profile, Error, { userId: string; role: Profile['role'] }>({
    mutationFn: async ({ userId, role }) => {
      const { data, error } = await supabase
        .from('profiles')
        .update({ role })
        .eq('id', userId)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data as Profile;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};

// Update user's obra access
export const useUpdateUserObraAccess = () => {
  const queryClient = useQueryClient();
  return useMutation<void, Error, { userId: string; obraIds: string[] }>({
    mutationFn: async ({ userId, obraIds }) => {
      // 1. Delete existing access for the user
      const { error: deleteError } = await supabase
        .from('obra_user_access')
        .delete()
        .eq('user_id', userId);
      if (deleteError) throw new Error(deleteError.message);

      // 2. Insert new access records if any are provided
      if (obraIds.length > 0) {
        const newAccessRecords = obraIds.map(obraId => ({
          user_id: userId,
          obra_id: obraId,
        }));
        const { error: insertError } = await supabase
          .from('obra_user_access')
          .insert(newAccessRecords);
        if (insertError) throw new Error(insertError.message);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};

// Invite a new user
export const useInviteUser = () => {
  return useMutation<void, Error, { email: string; role: Profile['role'] }>({
    mutationFn: async ({ email, role }) => {
      const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, {
        data: { role: role },
      });
      if (error) throw new Error(error.message);
    },
  });
};