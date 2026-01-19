import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/integrations/supabase/auth-provider";
import { DiarioObra } from "./use-rdo";

interface RdoMetrics {
  totalRdosCount: number;
  approvedCount: number;
  pendingCount: number;
  draftCount: number;
  averageManpower: number;
  recentRdos: (DiarioObra & { obra_nome: string })[];
  actionRequiredRdos: (DiarioObra & { obra_nome: string })[];
}

const fetchRdoMetrics = async (userId: string): Promise<RdoMetrics> => {
  const { data: rdosData, error } = await supabase
    .from('diarios_obra')
    .select(`
      *,
      obras!inner (nome),
      rdo_mao_de_obra (quantidade)
    `)
    .eq('user_id', userId)
    .order('data_rdo', { ascending: false });

  if (error) throw error;

  const rdos = rdosData as any[];

  // Contagens por Status
  const approvedCount = rdos.filter(r => r.status === 'approved').length;
  const pendingCount = rdos.filter(r => r.status === 'pending' || r.status === 'rejected').length;
  const draftCount = rdos.filter(r => r.status === 'draft' || !r.status).length;

  // Média de Mão de Obra
  const totalManpower = rdos.reduce((sum, rdo) => {
    const daily = rdo.rdo_mao_de_obra?.reduce((mSum: number, m: any) => mSum + m.quantidade, 0) || 0;
    return sum + daily;
  }, 0);
  const averageManpower = rdos.length > 0 ? Math.round(totalManpower / rdos.length) : 0;

  // Ação Requerida (Pendentes e Rejeitados)
  const actionRequired = rdos
    .filter(r => r.status === 'pending' || r.status === 'rejected')
    .slice(0, 5)
    .map(r => ({ ...r, obra_nome: r.obras.nome }));

  const recent = rdos.slice(0, 5).map(r => ({ ...r, obra_nome: r.obras.nome }));

  return {
    totalRdosCount: rdos.length,
    approvedCount,
    pendingCount,
    draftCount,
    averageManpower,
    recentRdos: recent as any,
    actionRequiredRdos: actionRequired as any,
  };
};

export const useRdoDashboardMetrics = () => {
  const { user } = useAuth();
  return useQuery<RdoMetrics, Error>({
    queryKey: ['rdoDashboardMetrics', user?.id],
    queryFn: () => fetchRdoMetrics(user!.id),
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5,
  });
};