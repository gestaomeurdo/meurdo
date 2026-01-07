import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ReportData {
  totalSpentPeriod: number;
  totalSpentObra: number;
  budgetUsedPercent: number;
  activitiesCompleted: number;
  initialBudget: number;
  // New activity metrics
  totalTollsPeriod: number;
  totalMileagePeriod: number;
}

const fetchReportData = async (obraId: string, startDate: string, endDate: string): Promise<ReportData> => {
  const { data, error } = await supabase.rpc('get_report_data', {
    p_obra_id: obraId,
    p_start_date: startDate,
    p_end_date: endDate,
  });

  if (error) {
    console.error("Error fetching report data:", error);
    throw new Error(error.message);
  }

  return data as ReportData;
};

export const useReportData = (obraId: string, startDate: string, endDate: string) => {
  return useQuery<ReportData, Error>({
    queryKey: ['reportData', obraId, startDate, endDate],
    queryFn: () => fetchReportData(obraId, startDate, endDate),
    enabled: !!obraId && !!startDate && !!endDate,
  });
};