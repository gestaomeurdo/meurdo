import { useAuth } from "@/integrations/supabase/auth-provider";
import { showError, showSuccess } from "@/utils/toast";
import { useState } from "react";

// NOTE: Replace with your actual Supabase Project ID
const SUPABASE_PROJECT_ID = "edguowimanbdjyubspas";
const FUNCTION_URL = `https://${SUPABASE_PROJECT_ID}.supabase.co/functions/v1/export-activities-csv`;

interface ExportActivitiesParams {
  obraId: string;
  startDate: string;
  endDate: string;
}

export const useExportActivitiesCsv = () => {
  const { session } = useAuth();
  const [isExporting, setIsExporting] = useState(false);

  const exportCsv = async (params: ExportActivitiesParams) => {
    if (!session) {
      showError("Você precisa estar logado para exportar dados.");
      return;
    }
    if (!params.obraId || !params.startDate || !params.endDate) {
      showError("Selecione a obra e o período para exportar as atividades.");
      return;
    }

    setIsExporting(true);
    
    try {
      const response = await fetch(FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Falha na exportação: ${response.status} - ${errorText}`);
      }

      // Trigger file download
      const blob = await response.blob();
      const contentDisposition = response.headers.get('Content-Disposition');
      const filenameMatch = contentDisposition && contentDisposition.match(/filename="(.+)"/);
      const filename = filenameMatch ? filenameMatch[1] : 'relatorio_atividades.csv';

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      showSuccess("Exportação CSV de atividades concluída com sucesso!");

    } catch (error) {
      console.error("Export error:", error);
      showError(`Erro ao exportar CSV de atividades: ${error instanceof Error ? error.message : "Erro desconhecido"}`);
    } finally {
      setIsExporting(false);
    }
  };

  return { exportCsv, isExporting };
};