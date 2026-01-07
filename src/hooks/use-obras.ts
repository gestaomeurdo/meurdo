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

  return useMutation<any, Error, ObraInput>({
    mutationFn: async (newObra) => {
      console.log("[useCreateObra] Iniciando criação de obra...", newObra);
      
      // Obtém a sessão atual para garantir que temos o ID do usuário
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session?.user) {
        console.error("[useCreateObra] Erro de sessão:", sessionError);
        throw new Error("Sessão inválida ou expirada. Por favor, faça login novamente.");
      }

      const userId = session.user.id;
      const payload = { ...newObra, user_id: userId };

      console.log("[useCreateObra] Enviando payload ao Supabase:", payload);

      const { data, error } = await supabase
        .from('obras')
        .insert(payload)
        .select(); // Removemos o .single() para evitar erros se o RLS de SELECT falhar

      if (error) {
        console.error("[useCreateObra] Erro no Supabase Insert:", error);
        throw new Error(error.message);
      }
      
      console.log("[useCreateObra] Obra criada com sucesso:", data);
      return data?.[0] || payload;
    },
    onSuccess: (data) => {
      const userId = data.user_id;
      queryClient.invalidateQueries({ queryKey: ['obras', userId] });
      queryClient.invalidateQueries({ queryKey: ['dashboardData', userId] });
    },
  });
};

export const useUpdateObra = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation<Obra, Error, Partial<ObraInput> & { id: string }>({
    mutationFn: async (payload) => {
      const { id, ...updateData } = payload;
      const { data, error } = await supabase
        .from('obras')
        .update(updateData)
        .eq('id', id)
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