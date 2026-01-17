import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/integrations/supabase/auth-provider";

export interface Cargo {
  id: string;
  nome: string;
  custo_diario: number;
  tipo: 'Próprio' | 'Empreiteiro';
  unidade: 'Diário' | 'Hora';
  avatar_url?: string | null;
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

  return useMutation<Cargo, Error, Omit<Cargo, 'id' | 'user_id'>>({
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

export const useBulkCreateCargos = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation<void, Error, Omit<Cargo, 'id' | 'user_id'>[]>({
    mutationFn: async (newCargos) => {
      if (!user) throw new Error("Usuário não autenticado.");
      
      const cargosToInsert = newCargos.map(cargo => ({
        ...cargo,
        user_id: user.id,
      }));

      const { error } = await supabase
        .from('cargos')
        .insert(cargosToInsert);

      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cargos'] });
    },
  });
};

export const useUpdateCargo = () => {
  const queryClient = useQueryClient();
  return useMutation<Cargo, Error, Cargo>({
    mutationFn: async (updatedCargo) => {
      const { id, ...rest } = updatedCargo;
      const { data, error } = await supabase
        .from('cargos')
        .update(rest)
        .eq('id', id)
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

export const useDeleteCargo = () => {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      const { error } = await supabase.from('cargos').delete().eq('id', id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cargos'] });
    },
  });
};

export const useDeleteAllCargos = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation<void, Error, void>({
    mutationFn: async () => {
      if (!user) return;
      const { error } = await supabase
        .from('cargos')
        .delete()
        .eq('user_id', user.id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cargos'] });
    },
  });
};