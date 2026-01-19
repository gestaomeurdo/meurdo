import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/integrations/supabase/auth-provider";
import { DiarioObra } from "./use-rdo";

interface RdoMetrics {
  totalRdosCount: number;
  totalManpowerAccumulated: number;
  totalEquipmentAccumulated: number;
  pendingRdosCount: number;
  openOccurrencesCount: number;
  recentRdos: DiarioObra[];
  actionRequiredRdos: (DiarioObra & { obra_nome: string })[];
}

const fetchRdoMetrics = async (userId: string): Promise<RdoMetrics> => {
  // Busca RDOs com joins para obras
  const { data: rdosData, error } = await supabase
    .from('diarios_obra')
    .select(`
      *,
      obras!inner (nome)
    `)
    .eq('user_id', userId)
    .order('data_rdo', { ascending: false });

  if (error) {
    console.error("Error fetching RDO metrics:", error);
    throw new Error(error.message);
  }

  const rdos = rdosData as any[];

  // 1. Totais
  const totalRdosCount = rdos.length;
  const totalManpowerAccumulated = rdos.reduce((sum, rdo) => {
    const dailyManpower = rdo.rdo_mao_de_obra?.reduce((mSum: number, m: any) => mSum + m.quantidade, 0) || 0;
    return sum + dailyManpower;
  }, 0);
  const totalEquipmentAccumulated = rdos.reduce((sum, rdo) => {
    const dailyEquipment = rdo.rdo_equipamentos?.length || 0;
    return sum + dailyEquipment;
  }, 0);

  // 2. Filtro de Pendências (Ação Requerida)
  // Status: 'pending' ou 'rejected'
  // Ordenação: Antigos primeiro (ascending) para priorizar o atraso
  const actionRequired = rdos
    .filter(rdo => rdo.status === 'pending' || rdo.status === 'rejected')
    .sort((a, b) => a.data_rdo.localeCompare(b.data_rdo))
    .slice(0, 5)
    .map(rdo => ({
      ...rdo,
      obra_nome: rdo.obras.nome,
    }));

  const pendingRdosCount = rdos.filter(rdo => rdo.status_dia !== 'Operacional').length;
  const openOccurrencesCount = rdos.filter(rdo => !!rdo.impedimentos_comentarios && rdo.impedimentos_comentarios.trim().length > 0).length;
  
  const recentRdos = rdos.slice(0, 5).map(rdo => ({
    ...rdo,
    obra_nome: rdo.obras.nome,
  })) as DiarioObra & { obra_nome: string }[];

  return {
    totalRdosCount,
    totalManpowerAccumulated,
    totalEquipmentAccumulated,
    pendingRdosCount,
    openOccurrencesCount,
    recentRdos: recentRdos as DiarioObra[],
    actionRequiredRdos: actionRequired as any,
  };
};

export const useRdoDashboardMetrics = () => {
  const { user } = useAuth();
  const userId = user?.id;

  return useQuery<RdoMetrics, Error>({
    queryKey: ['rdoDashboardMetrics', userId],
    queryFn: () => fetchRdoMetrics(userId!),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });
};