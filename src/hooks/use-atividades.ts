import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/integrations/supabase/auth-provider";

export type AtividadeStatus = 'Em andamento' | 'Concluída' | 'Pendente' | 'Atrasada' | 'Pausada' | 'No Prazo';

export interface Atividade {
  id: string;
  user_id: string;
  obra_id: string;
  data_atividade: string; 
  data_prevista: string | null;
  descricao: string;
  responsavel_nome: string | null;
  progresso_atual: number;
  etapa: string | null;
  status: AtividadeStatus;
  pedagio: number | null;
  km_rodado: number | null;
  created_at: string;
}

const fetchAtividades = async (obraId: string): Promise<Atividade[]> => {
  const { data, error } = await supabase
    .from('atividades_obra')
    .select('*')
    .eq('obra_id', obraId)
    .order('data_atividade', { ascending: false });

  if (error) throw new Error(error.message);
  return data as Atividade[];
};

export const useAtividades = (obraId: string) => {
  return useQuery<Atividade[], Error>({
    queryKey: ['atividades', obraId],
    queryFn: () => fetchAtividades(obraId),
    enabled: !!obraId,
  });
};

type AtividadeInput = Omit<Atividade, 'id' | 'user_id' | 'created_at'>;

export const useCreateAtividade = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation<Atividade, Error, AtividadeInput>({
    mutationFn: async (newAtividade) => {
      if (!user) throw new Error("Usuário não autenticado.");
      const { data, error } = await supabase
        .from('atividades_obra')
        .insert({ ...newAtividade, user_id: user.id })
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data as Atividade;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['atividades', data.obra_id] });
    },
  });
};

export const useUpdateAtividade = () => {
  const queryClient = useQueryClient();
  return useMutation<Atividade, Error, Partial<AtividadeInput> & { id: string }>({
    mutationFn: async (updatedAtividade) => {
      const { id, ...rest } = updatedAtividade;
      const { data, error } = await supabase
        .from('atividades_obra')
        .update(rest)
        .eq('id', id)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data as Atividade;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['atividades', data.obra_id] });
    },
  });
};

export const useDeleteAtividade = () => {
  const queryClient = useQueryClient();
  return useMutation<void, Error, { id: string; obraId: string }>({
    mutationFn: async ({ id }) => {
      const { error } = await supabase.from('atividades_obra').delete().eq('id', id);
      if (error) throw new Error(error.message);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['atividades', variables.obraId] });
    },
  });
};