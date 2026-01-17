import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DiarioObra } from "./use-rdo";

export interface RdoReportMetrics {
  totalManpower: number;
  rainDays: number;
  completedActivitiesCount: number;
  totalMaterialsReceived: number;
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
  if (!obraId || !startDate || !endDate) {
    throw new Error("Parâmetros de busca incompletos.");
  }

  // Busca os dados com as relações necessárias
  const { data: rdosData, error } = await supabase
    .from('diarios_obra')
    .select(`
      id,
      obra_id,
      data_rdo,
      clima_condicoes,
      status_dia,
      impedimentos_comentarios,
      observacoes_gerais,
      rdo_mao_de_obra (quantidade),
      rdo_atividades_detalhe (avanco_percentual),
      rdo_materiais (quantidade_entrada)
    `)
    .eq('obra_id', obraId)
    .gte('data_rdo', startDate)
    .lte('data_rdo', endDate)
    .order('data_rdo', { ascending: true });

  if (error) {
    console.error("[fetchRdoReportData] Erro Supabase:", error);
    throw new Error(error.message);
  }

  const rdos = (rdosData || []) as any[];

  let totalManpower = 0;
  let rainDays = 0;
  let completedActivitiesCount = 0;
  let totalMaterialsReceived = 0;
  const occurrenceTimeline: { date: string, obraId: string, comments: string }[] = [];
  const weatherDistribution: Record<string, number> = {};

  rdos.forEach(rdo => {
    // 1. Efetivo (Homens-Dia)
    const dailyManpower = rdo.rdo_mao_de_obra?.reduce((sum: number, m: any) => sum + (Number(m.quantidade) || 0), 0) || 0;
    totalManpower += dailyManpower;

    // 2. Dias de Chuva
    if (rdo.clima_condicoes && (rdo.clima_condicoes.includes('Chuva') || rdo.clima_condicoes === 'Chuva Leve' || rdo.clima_condicoes === 'Chuva Forte')) {
      rainDays++;
    }
    
    // 3. Atividades Concluídas (100%)
    const completedInRdo = rdo.rdo_atividades_detalhe?.filter((a: any) => Number(a.avanco_percentual) === 100).length || 0;
    completedActivitiesCount += completedInRdo;

    // 4. Materiais (Entradas registradas)
    const materialsInRdo = rdo.rdo_materiais?.filter((m: any) => (Number(m.quantidade_entrada) || 0) > 0).length || 0;
    totalMaterialsReceived += materialsInRdo;

    // 5. Ocorrências
    if (rdo.impedimentos_comentarios && rdo.impedimentos_comentarios.trim().length > 0) {
      occurrenceTimeline.push({
        date: rdo.data_rdo,
        obraId: rdo.obra_id,
        comments: rdo.impedimentos_comentarios,
      });
    }
    
    const clima = rdo.clima_condicoes || 'Não Informado';
    weatherDistribution[clima] = (weatherDistribution[clima] || 0) + 1;
  });

  return {
    totalManpower,
    rainDays,
    completedActivitiesCount,
    totalMaterialsReceived,
    occurrenceTimeline: occurrenceTimeline.sort((a, b) => b.date.localeCompare(a.date)), // Recentes primeiro
    weatherDistribution,
    allRdos: rdos,
  };
};

export const useRdoReportData = (obraId: string, startDate: string, endDate: string) => {
  return useQuery<RdoReportMetrics, Error>({
    queryKey: ['rdoReportData', obraId, startDate, endDate],
    queryFn: () => fetchRdoReportData({ obraId, startDate, endDate }),
    enabled: !!obraId && !!startDate && !!endDate && obraId !== '00000000-0000-0000-0000-000000000000',
    staleTime: 1000 * 60 * 5, // 5 minutos
    retry: 1,
  });
};