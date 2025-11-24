import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Atividade } from "./use-atividades";

interface FetchActivitiesParams {
  obraId: string;
  startDate: string;
  endDate: string;
}

const fetchActivitiesInPeriod = async ({ obraId, startDate, endDate }: FetchActivitiesParams): Promise<Atividade[]> => {
  const { data, error } = await supabase
    .from('atividades_obra')
    .select('*')
    .eq('obra_id', obraId)
    .gte('data_atividade', startDate)
    .lte('data_atividade', endDate)
    .order('data_atividade', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }
  return data as Atividade[];
};

export const useActivitiesInPeriod = (obraId: string, startDate: string, endDate: string) => {
  return useQuery<Atividade[], Error>({
    queryKey: ['activitiesInPeriod', obraId, startDate, endDate],
    queryFn: () => fetchActivitiesInPeriod({ obraId, startDate, endDate }),
    enabled: !!obraId && !!startDate && !!endDate,
  });
};