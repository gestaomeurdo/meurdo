import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/integrations/supabase/auth-provider";

export interface RdoAlert {
  id: string;
  data_rdo: string;
  obra_nome: string;
  rejection_reason: string;
  obra_id: string;
}

const fetchRdoAlerts = async (userId: string): Promise<RdoAlert[]> => {
  const { data, error } = await supabase
    .from('diarios_obra')
    .select(`
      id,
      data_rdo,
      rejection_reason,
      obra_id,
      obras (nome)
    `)
    .eq('user_id', userId)
    .eq('status', 'rejected')
    .order('data_rdo', { ascending: false });

  if (error) throw error;

  return (data as any[]).map(item => ({
    id: item.id,
    data_rdo: item.data_rdo,
    rejection_reason: item.rejection_reason,
    obra_id: item.obra_id,
    obra_nome: item.obras.nome
  }));
};

export const useRdoAlerts = () => {
  const { user } = useAuth();
  return useQuery<RdoAlert[], Error>({
    queryKey: ['rdoAlerts', user?.id],
    queryFn: () => fetchRdoAlerts(user!.id),
    enabled: !!user,
    refetchInterval: 1000 * 60, // Atualiza a cada minuto
  });
};