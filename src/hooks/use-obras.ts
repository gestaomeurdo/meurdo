import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/integrations/supabase/auth-provider";

export interface Obra {
  id: string;
  user_id: string;
  nome: string;
  endereco: string | null;
  dono_cliente: string | null;
  responsavel_tecnico: string | null;
  data_inicio: string; // Date string
  previsao_entrega: string | null; // Date string
  orcamento_inicial: number;
  status: 'ativa' | 'concluida' | 'pausada';
  criado_em: string;
}

// --- Fetching ---
const fetchObras = async (userId: string): Promise<Obra[]> => {
  const { data, error } = await supabase
    .from('obras')
    .select('*')
    .eq('user_id', userId)
    .order('data_inicio', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }
  return data as Obra[];
};

export const useObras = () => {
  const { user } = useAuth();
  const userId = user?.id;

  return useQuery<Obra[], Error>({
    queryKey: ['obras', userId],
    queryFn: () => fetchObras(userId!),
    enabled: !!userId,
    staleTime: 1000 * 60 * 1, // Cache data for 1 minute
  });
};

// --- Mutations ---

interface ObraInput {
  nome: string;
  endereco?: string | null;
  dono_cliente?: string | null;
  responsavel_tecnico?: string | null;
  data_inicio: string;
  previsao_entrega?: string | null;
  orcamento_inicial: number;
  status: 'ativa' | 'concluida' | 'pausada';
}

export const useCreateObra = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const userId = user?.id;

  return useMutation<Obra, Error, ObraInput>({
    mutationFn: async (newObra) => {
      if (!userId) throw new Error("Usuário não autenticado.");
      
      const { data, error } = await supabase
        .from('obras')
        .insert({ ...newObra, user_id: userId })
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }
      return data as Obra;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['obras', userId] });
      queryClient.invalidateQueries({ queryKey: ['dashboardData', userId] });
    },
  });
};

export const useUpdateObra = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const userId = user?.id;

  return useMutation<Obra, Error, Partial<ObraInput> & { id: string }>({
    mutationFn: async (payload) => {
      if (!userId) throw new Error("Usuário não autenticado.");

      const { id, ...updateData } = payload;

      const { data, error } = await supabase
        .from('obras')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', userId) // Segurança extra: garante que o dono está editando
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }
      return data as Obra;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['obras', userId] });
      queryClient.invalidateQueries({ queryKey: ['dashboardData', userId] });
    },
  });
};

export const useDeleteObra = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const userId = user?.id;

  return useMutation<void, Error, string>({
    mutationFn: async (obraId) => {
      if (!userId) throw new Error("Usuário não autenticado.");

      const { error } = await supabase
        .from('obras')
        .delete()
        .eq('id', obraId)
        .eq('user_id', userId);

      if (error) {
        throw new Error(error.message);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['obras', userId] });
      queryClient.invalidateQueries({ queryKey: ['dashboardData', userId] });
    },
  });
};