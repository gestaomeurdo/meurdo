import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/integrations/supabase/auth-provider";
import { format, subDays } from "date-fns";
import { DiarioObra } from "./use-rdo";

interface RdoMetrics {
  rdosTodayCount: number;
  totalManpowerToday: number;
  pendingRdosCount: number;
  openOccurrencesCount: number;
  recentRdos: DiarioObra[];
}

const fetchRdoMetrics = async (userId: string): Promise<RdoMetrics> => {
  const today = format(new Date(), 'yyyy-MM-dd');
  const sevenDaysAgo = format(subDays(new Date(), 7), 'yyyy-MM-dd');

  // Fetch RDOs for the last 7 days, including details needed for calculation
  const { data: rdosData, error } = await supabase
    .from('diarios_obra')
    .select(`
      id,
      obra_id,
      data_rdo,
      status_dia,
      impedimentos_comentarios,
      rdo_mao_de_obra (quantidade),
      obras!inner (nome)
    `)
    .eq('user_id', userId)
    .gte('data_rdo', sevenDaysAgo)
    .order('data_rdo', { ascending: false });

  if (error) {
    console.error("Error fetching RDO metrics:", error);
    throw new Error(error.message);
  }

  // We cast the result to include the joined 'obras' data
  const rdos = rdosData as (DiarioObra & { obras: { nome: string } })[];

  // 1. RDOs Today
  const rdosToday = rdos.filter(rdo => rdo.data_rdo === today);
  const rdosTodayCount = rdosToday.length;

  // 2. Total Manpower Today
  const totalManpowerToday = rdosToday.reduce((sum, rdo) => {
    const dailyManpower = rdo.rdo_mao_de_obra?.reduce((mSum, m) => mSum + m.quantidade, 0) || 0;
    return sum + dailyManpower;
  }, 0);

  // 3. Pending RDOs (Not Operational in the last 7 days)
  const pendingRdosCount = rdos.filter(rdo => 
    rdo.status_dia !== 'Operacional'
  ).length;

  // 4. Open Occurrences (RDOs with comments/impediments in the last 7 days)
  const openOccurrencesCount = rdos.filter(rdo => 
    !!rdo.impedimentos_comentarios && rdo.impedimentos_comentarios.trim().length > 0
  ).length;
  
  // Prepare recent RDOs list (last 5, including obra name)
  const recentRdos = rdos.slice(0, 5).map(rdo => ({
    ...rdo,
    obra_nome: rdo.obras.nome,
  })) as DiarioObra & { obra_nome: string }[];

  return {
    rdosTodayCount,
    totalManpowerToday,
    pendingRdosCount,
    openOccurrencesCount,
    recentRdos: recentRdos as DiarioObra[],
  };
};

export const useRdoDashboardMetrics = () => {
  const { user } = useAuth();
  const userId = user?.id;

  return useQuery<RdoMetrics, Error>({
    queryKey: ['rdoDashboardMetrics', userId],
    queryFn: () => fetchRdoMetrics(userId!),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};