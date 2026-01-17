import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/integrations/supabase/auth-provider";
import { ATIVIDADE_MODELS } from "@/utils/atividade-models";

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
  modelo_id?: string;
}

export const useCreateObra = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation<any, Error, ObraInput>({
    mutationFn: async (newObraData) => {
      if (!user) throw new Error("Usuário não identificado.");
      
      const { modelo_id, ...newObra } = newObraData;
      
      // 1. Criar a Obra
      const { data: createdObra, error: obraError } = await supabase
        .from('obras')
        .insert({ ...newObra, user_id: user.id })
        .select()
        .single();

      if (obraError) throw new Error(`Erro ao criar obra: ${obraError.message}`);
      if (!createdObra) throw new Error("A obra foi criada mas os dados não foram retornados.");

      // 2. Tentar popular as atividades se um modelo foi selecionado
      if (modelo_id) {
        try {
          const model = ATIVIDADE_MODELS.find(m => m.id === modelo_id);
          if (model) {
            const activitiesToInsert = model.atividades.map(atv => ({
              obra_id: createdObra.id,
              user_id: user.id,
              descricao: atv.descricao,
              etapa: atv.etapa,
              data_atividade: newObra.data_inicio,
              status: 'Pendente',
              progresso_atual: 0
            }));

            const { error: activityError } = await supabase
              .from('atividades_obra')
              .insert(activitiesToInsert);

            if (activityError) {
              console.error("[useCreateObra] Erro ao inserir atividades do modelo:", activityError);
              // Não travamos a criação da obra por erro nas atividades
            }
          }
        } catch (err) {
          console.error("[useCreateObra] Falha crítica na geração de atividades:", err);
        }
      }

      return createdObra;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['obras'] });
      queryClient.invalidateQueries({ queryKey: ['atividades'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardData'] });
    },
  });
};

export const useUpdateObra = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, Partial<ObraInput> & { id: string }>({
    mutationFn: async (payload) => {
      const { id, ...updateData } = payload;
      // Removemos modelo_id se ele vier do formulário por engano
      const cleanedData = { ...updateData };
      delete (cleanedData as any).modelo_id;

      const { error } = await supabase
        .from('obras')
        .update(cleanedData)
        .eq('id', id);

      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
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