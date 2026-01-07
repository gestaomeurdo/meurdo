import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/integrations/supabase/auth-provider";

// --- RDO Detail Types ---

export interface RdoAtividadeDetalhe {
  id: string;
  diario_id: string;
  descricao_servico: string;
  avanco_percentual: number;
  foto_anexo_url: string | null;
}

export interface RdoMaoDeObra {
  id: string;
  diario_id: string;
  funcao: string;
  quantidade: number;
}

export interface RdoEquipamento {
  id: string;
  diario_id: string;
  equipamento: string;
  horas_trabalhadas: number;
  horas_paradas: number;
}

// --- Main RDO Type ---

export type RdoStatusDia = 'Operacional' | 'Parcialmente Paralisado' | 'Totalmente Paralisado - Não Praticável';
export type RdoClima = 'Sol' | 'Nublado' | 'Chuva Leve' | 'Chuva Forte';

export interface DiarioObra {
  id: string;
  obra_id: string;
  user_id: string;
  data_rdo: string; // YYYY-MM-DD
  clima_condicoes: RdoClima | null;
  status_dia: RdoStatusDia;
  observacoes_gerais: string | null;
  impedimentos_comentarios: string | null;
  created_at: string;
  
  // Nested details (optional when fetching list)
  rdo_atividades_detalhe?: RdoAtividadeDetalhe[];
  rdo_mao_de_obra?: RdoMaoDeObra[];
  rdo_equipamentos?: RdoEquipamento[];
}

// --- Fetching ---

const fetchRdoByDate = async (obraId: string, date: string): Promise<DiarioObra | null> => {
  const { data, error } = await supabase
    .from('diarios_obra')
    .select(`
      *,
      rdo_atividades_detalhe (*),
      rdo_mao_de_obra (*),
      rdo_equipamentos (*)
    `)
    .eq('obra_id', obraId)
    .eq('data_rdo', date)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 means "no rows found"
    throw new Error(error.message);
  }
  
  return data as DiarioObra | null;
};

export const useRdoByDate = (obraId: string, date: string) => {
  return useQuery<DiarioObra | null, Error>({
    queryKey: ['rdo', obraId, date],
    queryFn: () => fetchRdoByDate(obraId, date),
    enabled: !!obraId && !!date,
  });
};

// --- Mutations ---

interface RdoInput {
  obra_id: string;
  data_rdo: string;
  clima_condicoes: RdoClima | null;
  status_dia: RdoStatusDia;
  observacoes_gerais: string | null;
  impedimentos_comentarios: string | null;
  
  // Nested data for insertion/update
  atividades: Omit<RdoAtividadeDetalhe, 'id' | 'diario_id'>[];
  mao_de_obra: Omit<RdoMaoDeObra, 'id' | 'diario_id'>[];
  equipamentos: Omit<RdoEquipamento, 'id' | 'diario_id'>[];
}

// Helper function to handle nested inserts
const insertRdoDetails = async (diarioId: string, details: RdoInput) => {
    const detailInserts = [];

    if (details.atividades.length > 0) {
        detailInserts.push(supabase.from('rdo_atividades_detalhe').insert(details.atividades.map(a => ({ ...a, diario_id: diarioId }))));
    }
    if (details.mao_de_obra.length > 0) {
        detailInserts.push(supabase.from('rdo_mao_de_obra').insert(details.mao_de_obra.map(m => ({ ...m, diario_id: diarioId }))));
    }
    if (details.equipamentos.length > 0) {
        detailInserts.push(supabase.from('rdo_equipamentos').insert(details.equipamentos.map(e => ({ ...e, diario_id: diarioId }))));
    }

    const results = await Promise.all(detailInserts);
    
    for (const result of results) {
        if (result.error) {
            throw new Error(`Erro ao inserir detalhes do RDO: ${result.error.message}`);
        }
    }
};

export const useCreateRdo = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation<DiarioObra, Error, RdoInput>({
    mutationFn: async (newRdo) => {
      if (!user) throw new Error("Usuário não autenticado.");
      
      const { atividades, mao_de_obra, equipamentos, ...mainRdo } = newRdo;
      
      // 1. Insert main RDO record
      const { data, error } = await supabase
        .from('diarios_obra')
        .insert({ ...mainRdo, user_id: user.id })
        .select('id')
        .single();

      if (error) throw new Error(error.message);
      
      const diarioId = data.id;

      // 2. Insert nested details
      await insertRdoDetails(diarioId, newRdo);

      // 3. Fetch the complete RDO record for return (optional, but good practice)
      const completeRdo = await fetchRdoByDate(newRdo.obra_id, newRdo.data_rdo);
      if (!completeRdo) throw new Error("Falha ao recuperar RDO completo após criação.");
      
      return completeRdo;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['rdo', data.obra_id, data.data_rdo] });
    },
  });
};

export const useUpdateRdo = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation<DiarioObra, Error, RdoInput & { id: string }>({
    mutationFn: async (updatedRdo) => {
      if (!user) throw new Error("Usuário não autenticado.");
      
      const { id, atividades, mao_de_obra, equipamentos, ...mainRdo } = updatedRdo;
      
      // 1. Update main RDO record
      const { error: updateError } = await supabase
        .from('diarios_obra')
        .update(mainRdo)
        .eq('id', id)
        .eq('user_id', user.id); // Ensure user owns the RDO

      if (updateError) throw new Error(updateError.message);
      
      // 2. Delete existing details and insert new ones (simplest update strategy for nested lists)
      // Note: We ignore errors here as the tables might be empty
      await supabase.from('rdo_atividades_detalhe').delete().eq('diario_id', id);
      await supabase.from('rdo_mao_de_obra').delete().eq('diario_id', id);
      await supabase.from('rdo_equipamentos').delete().eq('diario_id', id);
      
      await insertRdoDetails(id, updatedRdo);

      // 3. Fetch the complete RDO record for return
      const completeRdo = await fetchRdoByDate(updatedRdo.obra_id, updatedRdo.data_rdo);
      if (!completeRdo) throw new Error("Falha ao recuperar RDO completo após atualização.");
      
      return completeRdo;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['rdo', data.obra_id, data.data_rdo] });
    },
  });
};