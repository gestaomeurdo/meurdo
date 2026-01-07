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

const fetchObras = async (userId: string): Promise<Obra[]> => {
  const { data, error } = await supabase
    .from('obras')
    .select('*')
    .eq('user_id', userId)
    .order('data_inicio', { ascending: false });

  if (error) throw new Error(error.message);
  return data as Obra[];
};

export const useObras = () => {
  const { user } = useAuth();
  const userId = user?.id;

  return useQuery<Obra[], Error>({
    queryKey: ['obras', userId],
    queryFn: () => fetchObras(userId!),
    enabled: !!userId,
    staleTime: 1000 * 60 * 1,
  });
};

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

  return useMutation<Obra, Error, ObraInput>({
    mutationFn: async (newObra) => {
      // Obtemos o usuário atualizado direto da sessão do Supabase para evitar closures antigas
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      
      if (!userId) throw new Error("Sessão expirada ou usuário não autenticado.");
      
      const payload = { ...newObra, user_id: userId };

      // Inserimos sem o .single() inicialmente para ver se o erro é no select
      const { data, error } = await supabase
        .from('obras')
        .insert(payload)
        .select()
        .single();

      if (error) {
        console.error("[useCreateObra] Erro detalhado:", error);
        if (error.code === '23505') throw new Error("Já existe uma obra com este nome.");
        throw new Error(error.message);
      }
      
      return data as Obra;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['obras', data.user_id] });
      queryClient.invalidateQueries({ queryKey: ['dashboardData', data.user_id] });
    },
  });
};

export const useUpdateObra = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation<Obra, Error, Partial<ObraInput> & { id: string }>({
    mutationFn: async (payload) => {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      if (!userId) throw new Error("Sessão expirada.");

      const { id, ...updateData } = payload;
      const { data, error } = await supabase
        .from('obras')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data as Obra;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['obras', data.user_id] });
      queryClient.invalidateQueries({ queryKey: ['dashboardData', data.user_id] });
    },
  });
};

export const useDeleteObra = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation<void, Error, string>({
    mutationFn: async (obraId) => {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      if (!userId) throw new Error("Não autorizado.");

      const { error } = await supabase
        .from('obras')
        .delete()
        .eq('id', obraId)
        .eq('user_id', userId);

      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['obras'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardData'] });
    },
  });
};