import { pdf } from '@react-pdf/renderer';
import React from 'react';
import { DiarioObra } from "@/hooks/use-rdo";
import { Profile } from "@/hooks/use-profile";
import { Obra } from "@/hooks/use-obras";
import { RdoPdfTemplate } from "@/components/rdo/RdoPdfTemplate";
import { ExecutiveReportTemplate } from "@/components/relatorios/ExecutiveReportTemplate";

export const generateRdoPdf = async (
  rdo: DiarioObra, 
  obraNome: string, 
  profile: Profile | null, 
  obra?: Obra
) => {
  const isPro = profile?.subscription_status === 'active' || profile?.plan_type === 'pro';

  try {
    const blob = await pdf(
      React.createElement(RdoPdfTemplate, { 
        rdo, 
        obraNome: obraNome || "Obra", 
        profile, 
        obra,
        isPro
      })
    ).toBlob();

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `RDO_${obraNome.replace(/\s/g, '_')}_${rdo.data_rdo}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
  } catch (error) {
    console.error("[PDF Engine] Failure:", error);
  }
};

export const generateExecutiveReportPdf = async (metrics: any, obra: Obra, profile: any, start: string, end: string) => {
    // Lógica similar para o executivo...
};