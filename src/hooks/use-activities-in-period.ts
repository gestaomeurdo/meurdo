import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Atividade } from "./use-atividades";
import { fetchProfile, Profile } from "./use-profile";

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
  // 1. Fetch Activities
  const { data: activitiesData, error: activitiesError } = await supabase
    .from('atividades_obra')
    .select(`*`)
    .eq('obra_id', obraId)
    .gte('data_atividade', startDate)
    .lte('data_atividade', endDate)
    .order('data_atividade', { ascending: true });

  if (activitiesError) {
    throw new Error(activitiesError.message);
  }
  
  const activities = activitiesData as Atividade[];

  // 2. Collect unique user IDs
  const userIds = Array.from(new Set(activities.map(a => a.user_id).filter((id): id is string => !!id)));

  // 3. Fetch all necessary profiles in parallel
  const { data: profilesData, error: profilesError } = await supabase
    .from('profiles')
    .select('id, first_name, last_name')
    .in('id', userIds);

  if (profilesError) {
    console.warn("Could not fetch profiles for activities, proceeding without profile names:", profilesError.message);
    // If profile fetch fails, we proceed with empty profile data
  }

  const profileMap = new Map<string, Pick<Profile, 'id' | 'first_name' | 'last_name'>>();
  profilesData?.forEach(p => profileMap.set(p.id, p));

  // 4. Map activities with profile data
  const activitiesWithProfiles: AtividadeWithProfile[] = activities.map(activity => {
    const profile = activity.user_id ? profileMap.get(activity.user_id) : null;

    return {
      ...activity,
      profiles: {
        first_name: profile?.first_name || null,
        last_name: profile?.last_name || null,
        id: profile?.id,
      }
    }
  });
  
  return activitiesWithProfiles;
};

export const useActivitiesInPeriod = (obraId: string, startDate: string, endDate: string) => {
  return useQuery<AtividadeWithProfile[], Error>({
    queryKey: ['activitiesInPeriod', obraId, startDate, endDate],
    queryFn: () => fetchActivitiesInPeriod({ obraId, startDate, endDate }),
    enabled: !!obraId && !!startDate && !!endDate,
  });
};