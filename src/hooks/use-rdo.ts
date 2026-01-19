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
}

export interface RdoEquipamento {
  id: string;
  diario_id: string;
  equipamento: string;
  horas_trabalhadas: number;
  horas_paradas: number;
  custo_hora: number; // Added field
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
// Changed to string to support "Manhã: Sol, Tarde: Chuva"
export type RdoClima = string; 
export type RdoPeriodo = string; 

export interface DiarioObra {
  id: string;
  obra_id: string;
  user_id: string;
  data_rdo: string;
  periodo: RdoPeriodo;
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
  
  // Safety Checklist
  safety_nr35: boolean;
  safety_epi: boolean;
  safety_cleaning: boolean;
  safety_dds: boolean;
  safety_comments: string | null;
  safety_photo_url: string | null;
  
  // Signatures
  signer_name: string | null;
  signer_registration: string | null;

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
      periodo,
      clima_condicoes,
      status_dia,
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

// Improved to fetch the MOST RECENT RDO before the current date
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
    .lt('data_rdo', dateString) // Less than current date
    .order('data_rdo', { ascending: false }) // Get the most recent one
    .limit(1)
    .maybeSingle();

  if (error) return null;
  return data as DiarioObra | null;
};

// --- Mutations ---
export interface RdoInput {
  obra_id: string;
  data_rdo: string;
  periodo: RdoPeriodo;
  clima_condicoes: RdoClima | null;
  status_dia: RdoStatusDia;
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
      queryClient.invalidateQueries({ queryKey: ['rdoCount'] });
      // Força a atualização do progresso das obras e das atividades
      queryClient.invalidateQueries({ queryKey: ['obrasProgress'] });
      queryClient.invalidateQueries({ queryKey: ['atividades'] });
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
      
      // Limpar detalhes antigos e reinserir (estratégia simples)
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
      // Força a atualização do progresso das obras e das atividades
      queryClient.invalidateQueries({ queryKey: ['obrasProgress'] });
      queryClient.invalidateQueries({ queryKey: ['atividades'] });
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
      // Força a atualização do progresso das obras (caso a exclusão afete o cálculo)
      queryClient.invalidateQueries({ queryKey: ['obrasProgress'] });
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
      queryClient.invalidateQueries({ queryKey: ['obrasProgress'] });
    },
  });
};

// --- RDO Payment Hook ---

interface RdoPaymentInput {
  obraId: string;
  rdoDate: string; 
  totalCost: number;
  manpowerDetails: { funcao: string, quantidade: number, custo_unitario: number }[];
  equipmentDetails: { equipamento: string, horas: number, custo_hora: number }[]; // Added
}

const getManpowerCategoryId = async (userId: string): Promise<string> => {
  // 1. Try match by user and partial name
  const { data, error } = await supabase
    .from('categorias_despesa')
    .select('id')
    .eq('user_id', userId)
    .ilike('nome', '%Mão de Obra%') // Case insensitive partial match
    .limit(1)
    .maybeSingle();

  if (data) return data.id;

  // 2. Create if missing
  const { data: newCategory, error: createError } = await supabase
    .from('categorias_despesa')
    .insert({ 
      nome: 'Mão de Obra', 
      descricao: 'Gerado automaticamente pelo RDO',
      user_id: userId 
    })
    .select('id')
    .single();

  if (createError) {
    throw new Error(`Erro ao criar categoria automática: ${createError.message}`);
  }
  
  return newCategory.id;
};

export const usePayRdo = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation<void, Error, RdoPaymentInput>({
    mutationFn: async ({ obraId, rdoDate, totalCost, manpowerDetails, equipmentDetails }) => {
      if (!user) throw new Error("Usuário não autenticado.");
      if (totalCost <= 0) throw new Error("Custo total deve ser maior que zero para registrar o pagamento.");

      const categoryId = await getManpowerCategoryId(user.id);

      let description = `Pagamento RDO ${format(new Date(rdoDate), 'dd/MM/yyyy')}.`;
      
      if (manpowerDetails.length > 0) {
        description += ` Equipe: ${manpowerDetails.map(m => `${m.quantidade}x ${m.funcao}`).join(', ')}.`;
      }
      
      if (equipmentDetails.length > 0) {
        description += ` Maq: ${equipmentDetails.map(e => `${e.equipamento} (${e.horas}h)`).join(', ')}.`;
      }

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
      // Invalidate all related queries to force refresh
      queryClient.invalidateQueries({ queryKey: ['financialEntries'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardData'] });
      queryClient.invalidateQueries({ queryKey: ['reportData'] });
    },
  });
};