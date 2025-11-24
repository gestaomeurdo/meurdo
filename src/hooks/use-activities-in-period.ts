import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Atividade } from "./use-atividades";

// Extend Atividade type to include profile data for the responsible user
export interface AtividadeWithProfile extends Atividade {
  profiles: { first_name: string | null, last_name: string | null };
}

interface FetchActivitiesParams {
  obraId: string;
  startDate: string;
  endDate: string;
}

const fetchActivitiesInPeriod = async ({ obraId, startDate, endDate }: FetchActivitiesParams): Promise<AtividadeWithProfile[]> => {
  const { data, error } = await supabase
    .from('atividades_obra')
    .select(`
      *,
      profiles!user_id (first_name, last_name)
    `)
    .eq('obra_id', obraId)
    .gte('data_atividade', startDate)
    .lte('data_atividade', endDate)
    .order('data_atividade', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }
  return data as AtividadeWithProfile[];
};

export const useActivitiesInPeriod = (obraId: string, startDate: string, endDate: string) => {
  return useQuery<AtividadeWithProfile[], Error>({
    queryKey: ['activitiesInPeriod', obraId, startDate, endDate],
    queryFn: () => fetchActivitiesInPeriod({ obraId, startDate, endDate }),
    enabled: !!obraId && !!startDate && !!endDate,
  });
};