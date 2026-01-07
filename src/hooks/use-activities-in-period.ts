import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Atividade } from "./use-atividades";

// Extend Atividade type to include profile data for the responsible user
export interface AtividadeWithProfile extends Atividade {
  profiles: { first_name: string | null, last_name: string | null, id: string | undefined };
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
      profiles!user_id (first_name, last_name, id)
    `)
    .eq('obra_id', obraId)
    .gte('data_atividade', startDate)
    .lte('data_atividade', endDate)
    .order('data_atividade', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }
  
  // Map user data from profiles join to ensure correct structure
  const activities = data.map(activity => {
    const profileData = (activity as any).profiles || {};

    return {
      ...activity,
      profiles: {
        first_name: profileData.first_name,
        last_name: profileData.last_name,
        id: profileData.id,
      }
    }
  }) as AtividadeWithProfile[];
  
  return activities;
};

export const useActivitiesInPeriod = (obraId: string, startDate: string, endDate: string) => {
  return useQuery<AtividadeWithProfile[], Error>({
    queryKey: ['activitiesInPeriod', obraId, startDate, endDate],
    queryFn: () => fetchActivitiesInPeriod({ obraId, startDate, endDate }),
    enabled: !!obraId && !!startDate && !!endDate,
  });
};