import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/integrations/supabase/auth-provider";

export type ReceiptStatus = 'Conforme' | 'Com Avaria';

export interface MaterialReceipt {
  id: string;
  obra_id: string;
  user_id: string;
  data_recebimento: string;
  material: string;
  quantidade: number;
  unidade: string | null;
  fornecedor: string | null;
  numero_nf: string | null;
  foto_url: string | null;
  status: ReceiptStatus;
  observacoes: string | null;
  criado_em: string;
}

const fetchReceipts = async (obraId: string, date?: string): Promise<MaterialReceipt[]> => {
  if (!obraId) return [];

  let query = supabase
    .from('recebimento_materiais')
    .select('*')
    .eq('obra_id', obraId);

  if (date) {
    query = query.eq('data_recebimento', date);
  }

  const { data, error } = await query.order('data_recebimento', { ascending: false });

  if (error) throw new Error(error.message);
  return data as MaterialReceipt[];
};

export const useMaterialReceipts = (obraId: string | undefined, date?: string) => {
  return useQuery<MaterialReceipt[], Error>({
    queryKey: ['materialReceipts', obraId, date],
    queryFn: () => fetchReceipts(obraId!, date),
    enabled: !!obraId && obraId !== '',
    staleTime: 1000 * 60 * 5, // 5 minutos de dados 'quentes'
    gcTime: 1000 * 60 * 30, // Mantém no cache por 30 min
  });
};

export const useCreateReceipt = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation<MaterialReceipt, Error, Omit<MaterialReceipt, 'id' | 'user_id' | 'criado_em'>>({
    mutationFn: async (newReceipt) => {
      if (!user) throw new Error("Usuário não autenticado.");
      const { data, error } = await supabase
        .from('recebimento_materiais')
        .insert({ ...newReceipt, user_id: user.id })
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data as MaterialReceipt;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materialReceipts'] });
    },
  });
};

export const useDeleteReceipt = () => {
  const queryClient = useQueryClient();
  return useMutation<void, Error, { id: string, obraId: string }>({
    mutationFn: async ({ id }) => {
      const { error } = await supabase.from('recebimento_materiais').delete().eq('id', id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materialReceipts'] });
    },
  });
};