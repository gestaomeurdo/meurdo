import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type RdoStatus = 'draft' | 'pending' | 'approved' | 'rejected';

export interface DiarioObra {
  id: string;
  obra_id: string;
  user_id: string;
  data_rdo: string;
  clima_condicoes: string | null;
  status_dia: string;
  observacoes_gerais: string | null;
  impedimentos_comentarios: string | null;
  created_at: string;
  responsible_signature_url: string | null;
  client_signature_url: string | null;
  status: RdoStatus;
  approval_token: string;
  safety_nr35?: boolean;
  safety_epi?: boolean;
  safety_cleaning?: boolean;
  safety_dds?: boolean;
  safety_comments?: string;
  rdo_atividades_detalhe?: any[];
  rdo_mao_de_obra?: any[];
  rdo_equipamentos?: any[];
  rdo_materiais?: any[];
  profiles?: {
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
    company_name: string | null;
  };
  obras?: {
    nome: string;
    endereco: string | null;
    foto_url: string | null;
    dono_cliente: string | null;
  };
}

export const useRdoList = (obraId: string) => {
  return useQuery({
    queryKey: ["rdos", obraId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("diarios_obra")
        .select(`
          *,
          rdo_atividades_detalhe (*),
          rdo_mao_de_obra (*),
          rdo_equipamentos (*),
          rdo_materiais (*)
        `)
        .eq("obra_id", obraId)
        .order("data_rdo", { ascending: false });
      if (error) throw error;
      return data as DiarioObra[];
    },
  });
};

export const useRdoByDate = (obraId: string, date: string) => {
  return useQuery({
    queryKey: ["rdo-date", obraId, date],
    queryFn: async () => {
      if (!obraId || !date) return null;
      const { data, error } = await supabase
        .from("diarios_obra")
        .select(`
          *,
          rdo_atividades_detalhe (*),
          rdo_mao_de_obra (*),
          rdo_equipamentos (*),
          rdo_materiais (*)
        `)
        .eq("obra_id", obraId)
        .eq("data_rdo", date)
        .maybeSingle();
      if (error) throw error;
      return data as DiarioObra;
    },
    enabled: !!obraId && !!date,
  });
};

export const useRdoByToken = (token?: string) => {
  return useQuery({
    queryKey: ["rdo-token", token],
    queryFn: async () => {
      if (!token) return null;
      const { data, error } = await supabase
        .from("diarios_obra")
        .select(`
          *,
          profiles (first_name, last_name, avatar_url, company_name),
          obras (nome, endereco, foto_url, dono_cliente),
          rdo_atividades_detalhe (*),
          rdo_mao_de_obra (*),
          rdo_equipamentos (*),
          rdo_materiais (*)
        `)
        .eq("approval_token", token)
        .single();
      if (error) throw error;
      return data as DiarioObra;
    },
    enabled: !!token,
  });
};

export const fetchPreviousRdo = async (obraId: string, date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    const { data, error } = await supabase
        .from("diarios_obra")
        .select(`
            *,
            rdo_mao_de_obra (*),
            rdo_equipamentos (*)
        `)
        .eq("obra_id", obraId)
        .lt("data_rdo", dateStr)
        .order("data_rdo", { ascending: false })
        .limit(1)
        .maybeSingle();
    
    if (error) throw error;
    return data as DiarioObra;
};

export const useCreateRdo = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: any) => {
      const { atividades, mao_de_obra, equipamentos, materiais, ...rdoData } = values;
      const { data: rdo, error: rdoError } = await supabase.from("diarios_obra").insert(rdoData).select().single();
      if (rdoError) throw rdoError;

      if (atividades?.length) await supabase.from("rdo_atividades_detalhe").insert(atividades.map((a: any) => ({ ...a, diario_id: rdo.id })));
      if (mao_de_obra?.length) await supabase.from("rdo_mao_de_obra").insert(mao_de_obra.map((m: any) => ({ ...m, diario_id: rdo.id })));
      if (equipamentos?.length) await supabase.from("rdo_equipamentos").insert(equipamentos.map((e: any) => ({ ...e, diario_id: rdo.id })));
      if (materiais?.length) await supabase.from("rdo_materiais").insert(materiais.map((m: any) => ({ ...m, diario_id: rdo.id })));

      return rdo;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["rdos", variables.obra_id] });
      queryClient.invalidateQueries({ queryKey: ["rdoDashboardMetrics"] });
    },
  });
};

export const useUpdateRdo = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: any) => {
      const { id, atividades, mao_de_obra, equipamentos, materiais, ...rdoData } = values;
      const { error: rdoError } = await supabase.from("diarios_obra").update(rdoData).eq("id", id);
      if (rdoError) throw rdoError;

      await supabase.from("rdo_atividades_detalhe").delete().eq("diario_id", id);
      await supabase.from("rdo_mao_de_obra").delete().eq("diario_id", id);
      await supabase.from("rdo_equipamentos").delete().eq("diario_id", id);
      await supabase.from("rdo_materiais").delete().eq("diario_id", id);

      if (atividades?.length) await supabase.from("rdo_atividades_detalhe").insert(atividades.map((a: any) => ({ ...a, diario_id: id })));
      if (mao_de_obra?.length) await supabase.from("rdo_mao_de_obra").insert(mao_de_obra.map((m: any) => ({ ...m, diario_id: id })));
      if (equipamentos?.length) await supabase.from("rdo_equipamentos").insert(equipamentos.map((e: any) => ({ ...e, diario_id: id })));
      if (materiais?.length) await supabase.from("rdo_materiais").insert(materiais.map((m: any) => ({ ...m, diario_id: id })));
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["rdos"] });
      queryClient.invalidateQueries({ queryKey: ["rdoDashboardMetrics"] });
    },
  });
};

export const useRequestRdoApproval = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }: { id: string; obraId: string }) => {
      const { error } = await supabase
        .from("diarios_obra")
        .update({ status: 'pending', rejection_reason: null })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["rdos", variables.obraId] });
      queryClient.invalidateQueries({ queryKey: ["rdoDashboardMetrics"] });
    },
  });
};

export const useResubmitRdo = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }: { id: string; obraId: string }) => {
      const { error } = await supabase
        .from("diarios_obra")
        .update({ status: 'pending', rejection_reason: null })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["rdos", variables.obraId] });
      queryClient.invalidateQueries({ queryKey: ["rdoDashboardMetrics"] });
    },
  });
};

export const useApproveRdo = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ token, signatureUrl, signerName, signerRole, metadata }: any) => {
      const { error } = await supabase
        .from("diarios_obra")
        .update({ 
          status: 'approved', 
          client_signature_url: signatureUrl,
          signer_name: signerName,
          signer_registration: signerRole,
          approval_metadata: metadata,
          approved_at: new Date().toISOString()
        })
        .eq("approval_token", token);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rdos"] });
      queryClient.invalidateQueries({ queryKey: ["rdoDashboardMetrics"] });
    },
  });
};

export const useRejectRdo = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ token, reason }: any) => {
      const { error } = await supabase
        .from("diarios_obra")
        .update({ status: 'rejected', rejection_reason: reason })
        .eq("approval_token", token);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rdos"] });
      queryClient.invalidateQueries({ queryKey: ["rdoDashboardMetrics"] });
    },
  });
};

export const useDeleteRdo = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }: { id: string; obraId: string }) => {
      const { error } = await supabase.from("diarios_obra").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["rdos", variables.obraId] });
      queryClient.invalidateQueries({ queryKey: ["rdoDashboardMetrics"] });
    },
  });
};

export const useDeleteAllRdo = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (obraId: string) => {
      const { error } = await supabase.from("diarios_obra").delete().eq("obra_id", obraId);
      if (error) throw error;
    },
    onSuccess: (_, obraId) => {
      queryClient.invalidateQueries({ queryKey: ["rdos", obraId] });
      queryClient.invalidateQueries({ queryKey: ["rdoDashboardMetrics"] });
    },
  });
};