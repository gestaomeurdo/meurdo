import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/integrations/supabase/auth-provider";
import { format } from "date-fns";
import { formatCurrency } from "@/utils/formatters";

// --- RDO Detail Types ---
export interface RdoAtividadeDetalhe {
  id: string;
  diario_id: string;
  descricao_servico: string;
  avanco_percentual: number;
  foto_anexo_url: string | null;
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
}

export interface RdoEquipamento {
  id: string;
  diario_id: string;
  equipamento: string;
  horas_trabalhadas: number;
  horas_paradas: number;
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
export type RdoClima = 'Sol' | 'Nublado' | 'Chuva Leve' | 'Chuva Forte';

export interface DiarioObra {
  id: string;
  obra_id: string;
  user_id: string;
  data_rdo: string;
  clima_condicoes: RdoClima | null;
  status_dia: RdoStatusDia;
  observacoes_gerais: string | null;
  impedimentos_comentarios: string | null;
  created_at: string;
  responsavel?: string;
  responsible_signature_url: string | null;
  client_signature_url: string | null;
  work_stopped: boolean;
  hours_lost: number;
  
  rdo_atividades_detalhe?: RdoAtividadeDetalhe[];
  rdo_mao_de_obra?: RdoMaoDeObra[];
  rdo_equipamentos?: RdoEquipamento[];
  rdo_materiais?: RdoMaterial[];
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

export const useRdoByDate = (obraId: string, date: string) => {
  return useQuery<DiarioObra | null, Error>({
    queryKey: ['rdo', obraId, date],
    queryFn: () => fetchRdoByDate(obraId, date),
    enabled: !!obraId && !!date,
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
      clima_condicoes,
      status_dia,
      user_id,
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
  const yesterday = new Date(currentDate);
  yesterday.setDate(currentDate.getDate() - 1);
  const yesterdayString = format(yesterday, 'yyyy-MM-dd');

  const { data, error } = await supabase
    .from('diarios_obra')
    .select(`
      id,
      obra_id,
      data_rdo,
      rdo_mao_de_obra (*),
      rdo_equipamentos (*),
      rdo_materiais (*)
    `)
    .eq('obra_id', obraId)
    .eq('data_rdo', yesterdayString)
    .maybeSingle();

  if (error) return null;
  return data as DiarioObra | null;
};

// --- Mutations ---
export interface RdoInput {
  obra_id: string;
  data_rdo: string;
  clima_condicoes: RdoClima | null;
  status_dia: RdoStatusDia;
  observacoes_gerais: string | null;
  impedimentos_comentarios: string | null;
  responsible_signature_url: string | null;
  client_signature_url: string | null;
  work_stopped: boolean;
  hours_lost: number;

  atividades: Omit<RdoAtividadeDetalhe, 'id' | 'diario_id'>[];
  mao_de_obra: Omit<RdoMaoDeObra, 'id' | 'diario_id' | 'cargo_id'>[]; 
  equipamentos: Omit<RdoEquipamento, 'id' | 'diario_id'>[];
  materiais: Omit<RdoMaterial, 'id' | 'diario_id' | 'created_at'>[]; 
}

const insertRdoDetails = async (diarioId: string, details: RdoInput) => {
    if (details.atividades.length > 0) {
        const { error } = await supabase.from('rdo_atividades_detalhe').insert(details.atividades.map(a => ({ ...a, diario_id: diarioId })));
        if (error) throw error;
    }
    if (details.mao_de_obra.length > 0) {
        const { error } = await supabase.from('rdo_mao_de_obra').insert(details.mao_de_obra.map(m => ({ ...m, diario_id: diarioId })));
        if (error) throw error;
    }
    if (details.equipamentos.length > 0) {
        const { error } = await supabase.from('rdo_equipamentos').insert(details.equipamentos.map(e => ({ ...e, diario_id: diarioId })));
        if (error) throw error;
    }
    if (details.materiais.length > 0) { 
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
      await insertRdoDetails(data.id, newRdo);
      
      const completeRdo = await fetchRdoByDate(newRdo.obra_id, newRdo.data_rdo);
      if (!completeRdo) throw new Error("Erro ao recuperar RDO criado.");
      return completeRdo;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['rdoList', data.obra_id] });
      queryClient.invalidateQueries({ queryKey: ['rdo', data.obra_id, data.data_rdo] });
      queryClient.invalidateQueries({ queryKey: ['rdoDashboardMetrics'] });
      queryClient.invalidateQueries({ queryKey: ['rdoCount'] });
    },
  });
};

export const useUpdateRdo = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation<DiarioObra, Error, RdoInput & { id: string }>({
    mutationFn: async (updatedRdo) => {
      if (!user) throw new Error("Usuário não autenticado.");
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
      queryClient.invalidateQueries({ queryKey: ['rdoDashboardMetrics'] });
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
      queryClient.invalidateQueries({ queryKey: ['rdoDashboardMetrics'] });
      queryClient.invalidateQueries({ queryKey: ['rdoCount'] });
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
      queryClient.invalidateQueries({ queryKey: ['rdoDashboardMetrics'] });
      queryClient.invalidateQueries({ queryKey: ['rdoCount'] });
    },
  });
};

// --- RDO Payment Hook ---

interface RdoPaymentInput {
  obraId: string;
  rdoDate: string; 
  totalCost: number;
  manpowerDetails: { funcao: string, quantidade: number, custo_unitario: number }[];
}

const getManpowerCategoryId = async (): Promise<string> => {
  const { data, error } = await supabase
    .from('categorias_despesa')
    .select('id')
    .eq('nome', 'Mão de Obra')
    .single();

  if (error) {
    throw new Error("Categoria 'Mão de Obra' não encontrada. Cadastre-a primeiro.");
  }
  return data.id;
};

export const usePayRdo = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation<void, Error, RdoPaymentInput>({
    mutationFn: async ({ obraId, rdoDate, totalCost, manpowerDetails }) => {
      if (!user) throw new Error("Usuário não autenticado.");
      if (totalCost <= 0) throw new Error("Custo total deve ser maior que zero para registrar o pagamento.");

      const categoryId = await getManpowerCategoryId();

      const description = `Pagamento Mão de Obra RDO ${format(new Date(rdoDate), 'dd/MM/yyyy')}. Detalhes: ${
        manpowerDetails.map(m => `${m.quantidade}x ${m.funcao} (${formatCurrency(m.custo_unitario)})`).join(', ')
      }`;

      const newEntry = {
        obra_id: obraId,
        user_id: user.id,
        data_gasto: rdoDate,
        categoria_id: categoryId,
        descricao: description,
        valor: totalCost,
        forma_pagamento: 'Transferência', 
      };

      const { error } = await supabase
        .from('lancamentos_financeiros')
        .insert(newEntry);

      if (error) {
        throw new Error(error.message);
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['financialEntries', { obraId: variables.obraId }] });
      queryClient.invalidateQueries({ queryKey: ['dashboardData'] });
      queryClient.invalidateQueries({ queryKey: ['reportData'] });
    },
  });
};