import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DiarioObra, RdoAtividadeDetalhe, RdoMaoDeObra } from "./use-rdo";

export interface RdoReportMetrics {
  totalManpower: number;
  rainDays: number;
  completedActivitiesCount: number;
  occurrenceTimeline: { date: string, obraId: string, comments: string }[];
  weatherDistribution: Record<string, number>;
  allRdos: DiarioObra[];
}

interface FetchRdoReportParams {
  obraId: string;
  startDate: string;
  endDate: string;
}

const fetchRdoReportData = async ({ obraId, startDate, endDate }: FetchRdoReportParams): Promise<RdoReportMetrics> => {
  const { data: rdosData, error } = await supabase
    .from('diarios_obra')
    .select(`
      id,
      data_rdo,
      clima_condicoes,
      status_dia,
      impedimentos_comentarios,
      observacoes_gerais,
      rdo_mao_de_obra (quantidade),
      rdo_atividades_detalhe (avanco_percentual)
    `)
    .eq('obra_id', obraId)
    .gte('data_rdo', startDate)
    .lte('data_rdo', endDate)
    .order('data_rdo', { ascending: true });

  if (error) {
    console.error("Error fetching RDO report data:", error);
    throw new Error(error.message);
  }

  const rdos = rdosData as (DiarioObra & { rdo_mao_de_obra: RdoMaoDeObra[], rdo_atividades_detalhe: RdoAtividadeDetalhe[] })[];

  let totalManpower = 0;
  let rainDays = 0;
  let completedActivitiesCount = 0;
  const occurrenceTimeline: { date: string, obraId: string, comments: string }[] = [];
  const weatherDistribution: Record<string, number> = {};

  rdos.forEach(rdo => {
    // 1. Total Manpower
    const dailyManpower = rdo.rdo_mao_de_obra?.reduce((sum, m) => sum + m.quantidade, 0) || 0;
    totalManpower += dailyManpower;

    // 2. Rain Days
    if (rdo.clima_condicoes && rdo.clima_condicoes.includes('Chuva')) {
      rainDays++;
    }
    
    // 3. Completed Activities
    completedActivitiesCount += rdo.rdo_atividades_detalhe?.filter(a => a.avanco_percentual === 100).length || 0;

    // 4. Occurrence Timeline
    if (rdo.impedimentos_comentarios && rdo.impedimentos_comentarios.trim().length > 0) {
      occurrenceTimeline.push({
        date: rdo.data_rdo,
        obraId: rdo.obra_id,
        comments: rdo.impedimentos_comentarios,
      });
    }
    
    // 5. Weather Distribution
    const clima = rdo.clima_condicoes || 'N/A';
    weatherDistribution[clima] = (weatherDistribution[clima] || 0) + 1;
  });

  return {
    totalManpower,
    rainDays,
    completedActivitiesCount,
    occurrenceTimeline,
    weatherDistribution,
    allRdos: rdos as DiarioObra[],
  };
};

export const useRdoReportData = (obraId: string, startDate: string, endDate: string) => {
  return useQuery<RdoReportMetrics, Error>({
    queryKey: ['rdoReportData', obraId, startDate, endDate],
    queryFn: () => fetchRdoReportData({ obraId, startDate, endDate }),
    enabled: !!obraId && !!startDate && !!endDate,
  });
};