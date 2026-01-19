import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/integrations/supabase/auth-provider";
import { format } from "date-fns";

// --- RDO Detail Types ---
export interface RdoAtividadeDetalhe {
  id: string;
  diario_id: string;
  descricao_servico: string;
  avanco_percentual: number;
  foto_anexo_url: string | null;
  observacao?: string | null;
}

export type WorkforceType = 'Própria' | 'Terceirizada';

export interface RdoMaoDeObra {
  id: string;
  diario_id: string;
  funcao: string;
  quantidade: number;
  custo_unitario: number; 
  cargo_id: string | null;
  tipo: WorkforceType; 
  observacao?: string | null;
}

export interface RdoEquipamento {
  id: string;
  diario_id: string;
  equipamento: string;
  horas_trabalhadas: number;
  horas_paradas: number;
  custo_hora: number;
  foto_url?: string | null;
  observacao?: string | null;
}

export interface RdoMaterial {
  id: string;
  diario_id: string;
  nome_material: string;
  unidade: string;
  quantidade_entrada: number;
  quantidade_consumida: number;
  observacao: string | null;
}

// --- Main RDO Type ---
export type RdoStatusDia = 'Operacional' | 'Parcialmente Paralisado' | 'Totalmente Paralisado - Não Praticável';
export type RdoApprovalStatus = 'draft' | 'pending' | 'approved' | 'rejected';

export interface DiarioObra {
  id: string;
  obra_id: string;
  user_id: string;
  data_rdo: string;
  periodo: string;
  clima_condicoes: string | null;
  status_dia: RdoStatusDia;
  status: RdoApprovalStatus;
  approval_token: string;
  approved_at: string | null;
  rejection_reason: string | null;
  observacoes_gerais: string | null;
  impedimentos_comentarios: string | null;
  created_at: string;
  responsavel?: string;
  responsible_signature_url: string | null;
  client_signature_url: string | null;
  work_stopped: boolean;
  hours_lost: number;
  
  // Safety Checklist
  safety_nr35: boolean;
  safety_epi: boolean;
  safety_cleaning: boolean;
  safety_dds: boolean;
  safety_comments: string | null;
  safety_photo_url: string | null;
  
  // Specific Safety Photos
  safety_nr35_photo?: string | null;
  safety_epi_photo?: string | null;
  safety_cleaning_photo?: string | null;
  safety_dds_photo?: string | null;
  
  // Signatures
  signer_name: string | null;
  signer_registration: string | null;

  rdo_atividades_detalhe?: RdoAtividadeDetalhe[];
  rdo_mao_de_obra?: RdoMaoDeObra[];
  rdo_equipamentos?: RdoEquipamento[];
  rdo_materiais?: RdoMaterial[];
  obras?: { nome: string; dono_cliente: string | null; endereco: string | null };
  profiles?: { first_name: string | null; last_name: string | null; avatar_url: string | null; role: string | null; company_name: string | null };
}

// --- Fetching Single RDO ---
const fetchRdoByDate = async (obraId: string, date: string): Promise<DiarioObra | null> => {
  const { data, error } = await supabase
    .from('diarios_obra')
    .select(`
      *,
      rdo_atividades_detalhe (*),
      rdo_mao_de_obra (*),
      rdo_equipamentos (*),
      rdo_materiais (*)
    `)
    .eq('obra_id', obraId)
    .eq('data_rdo', date)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data as DiarioObra | null;
};

// --- Fetching RDO by Token (Public) ---
const fetchRdoByToken = async (token: string): Promise<DiarioObra | null> => {
  const { data, error } = await supabase
    .from('diarios_obra')
    .select(`
      *,
      rdo_atividades_detalhe (*),
      rdo_mao_de_obra (*),
      rdo_equipamentos (*),
      rdo_materiais (*),
      obras (nome, dono_cliente, endereco),
      profiles (first_name, last_name, avatar_url, role, company_name)
    `)
    .eq('approval_token', token)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data as DiarioObra | null;
};

export const useRdoByDate = (obraId: string, date: string) => {
  return useQuery<DiarioObra | null, Error>({
    queryKey: ['rdo', obraId, date],
    queryFn: () => fetchRdoByDate(obraId, date),
    enabled: !!obraId && !!date,
  });
};

export const useRdoByToken = (token: string | undefined) => {
  return useQuery<DiarioObra | null, Error>({
    queryKey: ['rdo-token', token],
    queryFn: () => fetchRdoByToken(token!),
    enabled: !!token,
    staleTime: 0,
  });
};

// --- Fetching RDO List ---
const fetchRdoList = async (obraId: string): Promise<DiarioObra[]> => {
  const { data, error } = await supabase
    .from('diarios_obra')
    .select(`
      id,
      obra_id,
      data_rdo,
      periodo,
      clima_condicoes,
      status_dia,
      status,
      approval_token,
      user_id,
      rdo_mao_de_obra (quantidade, custo_unitario),
      rdo_atividades_detalhe (foto_anexo_url),
      profiles (first_name, last_name)
    `)
    .eq('obra_id', obraId)
    .order('data_rdo', { ascending: false });

  if (error) throw new Error(error.message);
  
  return data.map((rdo: any) => ({
    ...rdo,
    responsavel: rdo.profiles ? `${rdo.profiles.first_name || ''} ${rdo.profiles.last_name || ''}`.trim() : 'N/A'
  })) as DiarioObra[];
};

export const useRdoList = (obraId: string) => {
  return useQuery<DiarioObra[], Error>({
    queryKey: ['rdoList', obraId],
    queryFn: () => fetchRdoList(obraId),
    enabled: !!obraId,
  });
};

export const fetchPreviousRdo = async (obraId: string, currentDate: Date): Promise<DiarioObra | null> => {
  const dateString = format(currentDate, 'yyyy-MM-dd');

  const { data, error } = await supabase
    .from('diarios_obra')
    .select(`
      id,
      obra_id,
      data_rdo,
      signer_name,
      signer_registration,
      rdo_mao_de_obra (*),
      rdo_equipamentos (*),
      rdo_materiais (*)
    `)
    .eq('obra_id', obraId)
    .lt('data_rdo', dateString)
    .order('data_rdo', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) return null;
  return data as DiarioObra | null;
};

// --- Mutations ---
export interface RdoInput {
  obra_id: string;
  data_rdo: string;
  periodo: string;
  clima_condicoes: string | null;
  status_dia: RdoStatusDia;
  status?: RdoApprovalStatus;
  observacoes_gerais: string | null;
  impedimentos_comentarios: string | null;
  responsible_signature_url: string | null;
  client_signature_url: string | null;
  work_stopped: boolean;
  hours_lost: number;

  // Safety Checklist
  safety_nr35: boolean;
  safety_epi: boolean;
  safety_cleaning: boolean;
  safety_dds: boolean;
  safety_comments?: string | null;
  safety_photo_url?: string | null;
  
  safety_nr35_photo?: string | null;
  safety_epi_photo?: string | null;
  safety_cleaning_photo?: string | null;
  safety_dds_photo?: string | null;

  // Signer
  signer_name?: string | null;
  signer_registration?: string | null;

  atividades: Omit<RdoAtividadeDetalhe, 'id' | 'diario_id'>[];
  mao_de_obra: Omit<RdoMaoDeObra, 'id' | 'diario_id' | 'cargo_id'>[]; 
  equipamentos: Omit<RdoEquipamento, 'id' | 'diario_id'>[];
  materiais: Omit<RdoMaterial, 'id' | 'diario_id' | 'created_at'>[]; 
}

const insertRdoDetails = async (diarioId: string, details: RdoInput) => {
    if (details.atividades && details.atividades.length > 0) {
        const { error } = await supabase.from('rdo_atividades_detalhe').insert(details.atividades.map(a => ({ ...a, diario_id: diarioId })));
        if (error) throw error;
    }
    if (details.mao_de_obra && details.mao_de_obra.length > 0) {
        const { error } = await supabase.from('rdo_mao_de_obra').insert(details.mao_de_obra.map(m => ({ ...m, diario_id: diarioId })));
        if (error) throw error;
    }
    if (details.equipamentos && details.equipamentos.length > 0) {
        const { error } = await supabase.from('rdo_equipamentos').insert(details.equipamentos.map(e => ({ ...e, diario_id: diarioId })));
        if (error) throw error;
    }
    if (details.materiais && details.materiais.length > 0) { 
        const { error } = await supabase.from('rdo_materiais').insert(details.materiais.map(m => ({ ...m, diario_id: diarioId })));
        if (error) throw error;
    }
};

export const useCreateRdo = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation<DiarioObra, Error, RdoInput>({
    mutationFn: async (newRdo) => {
      if (!user) throw new Error("Usuário não autenticado.");
      const { atividades, mao_de_obra, equipamentos, materiais, ...mainRdo } = newRdo;
      
      const { data, error } = await supabase
        .from('diarios_obra')
        .insert({ ...mainRdo, user_id: user.id })
        .select('id')
        .single();

      if (error) throw new Error(error.message);
      if (!data) throw new Error("Erro ao criar RDO: nenhum dado retornado.");
      
      await insertRdoDetails(data.id, newRdo);
      
      const completeRdo = await fetchRdoByDate(newRdo.obra_id, newRdo.data_rdo);
      if (!completeRdo) throw new Error("Erro ao recuperar RDO criado.");
      return completeRdo;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['rdoList', data.obra_id] });
      queryClient.invalidateQueries({ queryKey: ['rdo', data.obra_id, data.data_rdo] });
      queryClient.invalidateQueries({ queryKey: ['rdoDashboardMetrics'] });
    },
  });
};

export const useUpdateRdo = () => {
  const queryClient = useQueryClient();
  return useMutation<DiarioObra, Error, RdoInput & { id: string }>({
    mutationFn: async (updatedRdo) => {
      const { id, atividades, mao_de_obra, equipamentos, materiais, ...mainRdo } = updatedRdo;
      
      const { error: updateError } = await supabase
        .from('diarios_obra')
        .update(mainRdo)
        .eq('id', id);

      if (updateError) throw new Error(updateError.message);
      
      await supabase.from('rdo_atividades_detalhe').delete().eq('diario_id', id);
      await supabase.from('rdo_mao_de_obra').delete().eq('diario_id', id);
      await supabase.from('rdo_equipamentos').delete().eq('diario_id', id);
      await supabase.from('rdo_materiais').delete().eq('diario_id', id); 
      
      await insertRdoDetails(id, updatedRdo);
      
      const completeRdo = await fetchRdoByDate(updatedRdo.obra_id, updatedRdo.data_rdo);
      if (!completeRdo) throw new Error("Erro ao recuperar RDO atualizado.");
      return completeRdo;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['rdoList', data.obra_id] });
      queryClient.invalidateQueries({ queryKey: ['rdo', data.obra_id, data.data_rdo] });
    },
  });
};

export const useResubmitRdo = () => {
    const queryClient = useQueryClient();
    return useMutation<void, Error, { id: string, obraId: string }>({
        mutationFn: async ({ id }) => {
            const { error } = await supabase
                .from('diarios_obra')
                .update({ 
                    status: 'pending',
                    rejection_reason: null 
                })
                .eq('id', id);
            if (error) throw error;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['rdoList', variables.obraId] });
            queryClient.invalidateQueries({ queryKey: ['rdo'] });
            queryClient.invalidateQueries({ queryKey: ['rdoAlerts'] });
        },
    });
};

export const useApproveRdo = () => {
  const queryClient = useQueryClient();
  return useMutation<void, Error, { token: string, signatureUrl: string }>({
    mutationFn: async ({ token, signatureUrl }) => {
      const { error } = await supabase
        .from('diarios_obra')
        .update({ 
            status: 'approved', 
            client_signature_url: signatureUrl,
            approved_at: new Date().toISOString()
        })
        .eq('approval_token', token);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['rdo-token', variables.token] });
    },
  });
};

export const useRejectRdo = () => {
  const queryClient = useQueryClient();
  return useMutation<void, Error, { token: string, reason: string }>({
    mutationFn: async ({ token, reason }) => {
      const { error } = await supabase
        .from('diarios_obra')
        .update({ 
            status: 'rejected', 
            rejection_reason: reason 
        })
        .eq('approval_token', token);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['rdo-token', variables.token] });
    },
  });
};

export const useRequestRdoApproval = () => {
  const queryClient = useQueryClient();
  return useMutation<void, Error, { id: string, obraId: string }>({
    mutationFn: async ({ id }) => {
      const { error } = await supabase
        .from('diarios_obra')
        .update({ status: 'pending' })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['rdoList', variables.obraId] });
      queryClient.invalidateQueries({ queryKey: ['rdo'] });
    },
  });
};

export const useDeleteRdo = () => {
  const queryClient = useQueryClient();
  return useMutation<void, Error, { id: string, obraId: string }>({
    mutationFn: async ({ id }) => {
      const { error } = await supabase.from('diarios_obra').delete().eq('id', id);
      if (error) throw new Error(error.message);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['rdoList', variables.obraId] });
    },
  });
};

export const useDeleteAllRdo = () => {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (obraId) => {
      const { error } = await supabase
        .from('diarios_obra')
        .delete()
        .eq('obra_id', obraId);
      if (error) throw new Error(error.message);
    },
    onSuccess: (_, obraId) => {
      queryClient.invalidateQueries({ queryKey: ['rdoList', obraId] });
    },
  });
};