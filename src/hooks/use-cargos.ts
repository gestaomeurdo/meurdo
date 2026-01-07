import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/integrations/supabase/auth-provider";

export interface Cargo {
  id: string;
  nome: string;
  custo_diario: number;
}

const fetchCargos = async (userId: string): Promise<Cargo[]> => {
  const { data, error } = await supabase
    .from('cargos')
    .select('*')
    .eq('user_id', userId)
    .order('nome', { ascending: true });

  if (error) throw new Error(error.message);
  return data as Cargo[];
};

export const useCargos = () => {
  const { user } = useAuth();
  return useQuery<Cargo[], Error>({
    queryKey: ['cargos', user?.id],
    queryFn: () => fetchCargos(user!.id),
    enabled: !!user,
  });
};

export const useCreateCargo = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation<Cargo, Error, Omit<Cargo, 'id'>>({
    mutationFn: async (newCargo) => {
      const { data, error } = await supabase
        .from('cargos')
        .insert({ ...newCargo, user_id: user?.id })
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data as Cargo;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cargos'] });
    },
  });
};