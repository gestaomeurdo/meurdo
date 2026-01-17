import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/integrations/supabase/auth-provider";

export interface Maquina {
  id: string;
  nome: string;
  custo_hora: number;
}

const fetchMaquinas = async (userId: string): Promise<Maquina[]> => {
  const { data, error } = await supabase
    .from('maquinas')
    .select('*')
    .eq('user_id', userId)
    .order('nome', { ascending: true });

  if (error) throw new Error(error.message);
  return data as Maquina[];
};

export const useMaquinas = () => {
  const { user } = useAuth();
  return useQuery<Maquina[], Error>({
    queryKey: ['maquinas', user?.id],
    queryFn: () => fetchMaquinas(user!.id),
    enabled: !!user,
    staleTime: 1000 * 60 * 10,
  });
};

export const useCreateMaquina = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation<Maquina, Error, Omit<Maquina, 'id'>>({
    mutationFn: async (newMaquina) => {
      const { data, error } = await supabase
        .from('maquinas')
        .insert({ ...newMaquina, user_id: user?.id })
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data as Maquina;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maquinas'] });
    },
  });
};

export const useDeleteMaquina = () => {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      const { error } = await supabase.from('maquinas').delete().eq('id', id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maquinas'] });
    },
  });
};