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
  data_inicio: string; 
  previsao_entrega: string | null; 
  orcamento_inicial: number;
  status: 'ativa' | 'concluida' | 'pausada';
  criado_em: string;
}

const fetchObras = async (userId: string): Promise<Obra[]> => {
  const { data, error } = await supabase
    .from('obras')
    .select('*')
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
    staleTime: 1000 * 60,
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

  return useMutation<any, Error, ObraInput>({
    mutationFn: async (newObra) => {
      if (!user) throw new Error("Usuário não identificado.");
      
      const { data, error } = await supabase
        .from('obras')
        .insert({ ...newObra, user_id: user.id })
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['obras'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardData'] });
    },
  });
};

export const useUpdateObra = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, Partial<ObraInput> & { id: string }>({
    mutationFn: async (payload) => {
      const { id, ...updateData } = payload;

      // Usamos returning: 'minimal' para ser o mais rápido possível e evitar erros de permissão na leitura pós-gravação
      const { error } = await supabase
        .from('obras')
        .update(updateData)
        .eq('id', id);

      if (error) {
        console.error("[useUpdateObra] Erro:", error);
        throw new Error(error.message);
      }
    },
    onSuccess: () => {
      // Forçamos a atualização da lista para garantir que os novos dados apareçam
      queryClient.invalidateQueries({ queryKey: ['obras'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardData'] });
    },
  });
};

export const useDeleteObra = () => {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (obraId) => {
      const { error } = await supabase
        .from('obras')
        .delete()
        .eq('id', obraId);

      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['obras'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardData'] });
    },
  });
};