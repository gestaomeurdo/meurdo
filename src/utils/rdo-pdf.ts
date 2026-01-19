import { pdf } from '@react-pdf/renderer';
import React from 'react';
import { DiarioObra } from "@/hooks/use-rdo";
import { Profile } from "@/hooks/use-profile";
import { Obra } from "@/hooks/use-obras";
import { RdoPdfTemplate } from "@/components/rdo/RdoPdfTemplate";
import { ExecutiveReportTemplate } from "@/components/relatorios/ExecutiveReportTemplate";
import { RdoReportMetrics } from '@/hooks/use-rdo-report-data';

async function urlToBase64(url: string | null | undefined): Promise<string | null> {
  if (!url || typeof url !== 'string' || url.trim() === '' || url.includes('null')) return null;
  if (url.startsWith('data:')) return url;

  try {
    const response = await fetch(url, { mode: 'cors' });
    if (!response.ok) return null;
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.warn(`[PDF Image] Base64 fetch failed: ${url}`);
    return null;
  }
}

export const generateRdoPdf = async (
  rdo: DiarioObra, 
  obraNome: string, 
  profile: Profile | null, 
  obra?: Obra,
  rdoList?: DiarioObra[]
) => {
  try {
    let sequenceNumber = "01";
    if (rdoList) {
        const sorted = [...rdoList].sort((a, b) => a.data_rdo.localeCompare(b.data_rdo));
        const index = sorted.findIndex(item => item.id === rdo.id);
        if (index !== -1) sequenceNumber = (index + 1).toString().padStart(2, '0');
    }

    const [logoBase64, obraPhotoBase64, sigResponsibleBase64, sigClientBase64] = await Promise.all([
        urlToBase64(profile?.avatar_url),
        urlToBase64(obra?.foto_url),
        urlToBase64(rdo.responsible_signature_url),
        urlToBase64(rdo.client_signature_url)
    ]);

    const activityPhotosMap: Record<string, string> = {};
    if (rdo.rdo_atividades_detalhe) {
        for (const atv of rdo.rdo_atividades_detalhe) {
            if (atv.foto_anexo_url) {
                const b64 = await urlToBase64(atv.foto_anexo_url);
                if (b64) activityPhotosMap[atv.id] = b64;
            }
        }
    }

    const blob = await pdf(
      React.createElement(RdoPdfTemplate, { 
        rdo, 
        obraNome: obraNome || "Obra", 
        profile, 
        obra, 
        sequenceNumber,
        logoBase64,
        obraPhotoBase64,
        activityPhotosMap,
        sigResponsibleBase64,
        sigClientBase64
      })
    ).toBlob();

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `RDO_${sequenceNumber}_${obraNome.replace(/\s/g, '_')}_${rdo.data_rdo}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
  } catch (error) {
    console.error("[PDF Engine] Failure:", error);
    throw new Error(`Erro ao gerar PDF: ${error instanceof Error ? error.message : 'Verifique os anexos.'}`);
  }
};

/**
 * GERA O RELATÓRIO EXECUTIVO MENSAL (CONSOLIDADO)
 */
export const generateExecutiveReportPdf = async (
    rdoMetrics: RdoReportMetrics,
    obra: Obra,
    profile: Profile | null,
    startDate: string,
    endDate: string
) => {
    try {
        console.log("[PDF Engine] Generating Executive Report...");
        
        // 1. Carregar Foto da Obra
        const obraPhotoBase64 = await urlToBase64(obra.foto_url);
        
        // 2. Mapear fotos das atividades (pegar de vários RDOs)
        const activityPhotosMap: Record<string, string> = {};
        let photoCount = 0;
        
        for (const rdo of rdoMetrics.allRdos) {
            if (photoCount >= 6) break; // Limite para galeria
            const detail = rdo.rdo_atividades_detalhe?.find(a => a.foto_anexo_url);
            if (detail?.foto_anexo_url) {
                const b64 = await urlToBase64(detail.foto_anexo_url);
                if (b64) {
                    activityPhotosMap[detail.id] = b64;
                    photoCount++;
                }
            }
        }

        const blob = await pdf(
            React.createElement(ExecutiveReportTemplate, { 
                rdoMetrics, 
                obra, 
                profile, 
                startDate, 
                endDate, 
                obraPhotoBase64,
                activityPhotosMap
            })
        ).toBlob();

        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Performance_Report_${obra.nome.replace(/\s/g, '_')}_${startDate}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

    } catch (error) {
        console.error("[PDF Engine] Executive Failure:", error);
        throw error;
    }
};