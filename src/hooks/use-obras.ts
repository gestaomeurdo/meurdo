import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/integrations/supabase/auth-provider";
import { useProfile } from "./use-profile";

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
const fetchObras = async (userId: string, userRole: string | undefined): Promise<Obra[]> => {
  // Admins can see all obras
  if (userRole === 'administrator') {
    const { data, error } = await supabase
      .from('obras')
      .select('*')
      .order('data_inicio', { ascending: false });
    if (error) throw new Error(error.message);
    return data as Obra[];
  }

  // Non-admins see obras they have explicit access to
  const { data: accessData, error: accessError } = await supabase
    .from('obra_user_access')
    .select('obra_id')
    .eq('user_id', userId);

  if (accessError) {
    throw new Error(accessError.message);
  }

  if (!accessData || accessData.length === 0) {
    return []; // User has no access to any obra
  }

  const obraIds = accessData.map(item => item.obra_id);

  const { data, error } = await supabase
    .from('obras')
    .select('*')
    .in('id', obraIds)
    .order('data_inicio', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }
  return data as Obra[];
};

export const useObras = () => {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const userId = user?.id;
  const userRole = profile?.role;

  return useQuery<Obra[], Error>({
    queryKey: ['obras', userId, userRole],
    queryFn: () => fetchObras(userId!, userRole),
    enabled: !!userId && !!userRole,
  });
};

// --- Mutations ---

interface ObraInput {
  nome: string;
  endereco?: string;
  dono_cliente?: string;
  responsavel_tecnico?: string;
  data_inicio: string;
  previsao_entrega?: string;
  orcamento_inicial: number;
  status: 'ativa' | 'concluida' | 'pausada';
}

export const useCreateObra = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const userId = user?.id;

  return useMutation<Obra, Error, ObraInput>({
    mutationFn: async (newObra) => {
      if (!userId) throw new Error("User not authenticated.");
      
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
      queryClient.invalidateQueries({ queryKey: ['obras'] });
    },
  });
};

export const useUpdateObra = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const userId = user?.id;

  return useMutation<Obra, Error, Obra & { id: string }>({
    mutationFn: async (updatedObra) => {
      if (!userId) throw new Error("User not authenticated.");

      const { data, error } = await supabase
        .from('obras')
        .update(updatedObra)
        .eq('id', updatedObra.id)
        .eq('user_id', userId) // Ensure user can only update their own
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }
      return data as Obra;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['obras'] });
      queryClient.setQueryData(['obras', userId], (old: Obra[] | undefined) => 
        old ? old.map(o => o.id === data.id ? data : o) : [data]
      );
    },
  });
};

export const useDeleteObra = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const userId = user?.id;

  return useMutation<void, Error, string>({
    mutationFn: async (obraId) => {
      if (!userId) throw new Error("User not authenticated.");

      const { error } = await supabase
        .from('obras')
        .delete()
        .eq('id', obraId)
        .eq('user_id', userId); // Ensure user can only delete their own

      if (error) {
        throw new Error(error.message);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['obras'] });
    },
  });
};