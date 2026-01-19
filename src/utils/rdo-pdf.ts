import { pdf } from '@react-pdf/renderer';
import React from 'react';
import { DiarioObra } from "@/hooks/use-rdo";
import { Profile } from "@/hooks/use-profile";
import { Obra } from "@/hooks/use-obras";
import { RdoPdfTemplate } from "@/components/rdo/RdoPdfTemplate";
import { format } from "date-fns";

const SYSTEM_LOGO_URL = "https://meurdo.com.br/wp-content/uploads/2026/01/Logo-MEU-RDO-scaled.png";

async function urlToBase64(url: string | null | undefined): Promise<string | null> {
  if (!url || typeof url !== 'string' || url.trim() === '') return null;
  
  try {
    const response = await fetch(url, { 
      mode: 'cors',
      cache: 'no-cache'
    });
    
    if (!response.ok) return null;
    
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error("Erro ao ler blob"));
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.warn(`[PDF Preflight] Falha CORS para imagem: ${url}`);
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
    console.log("[PDF Generator] Preparando ativos para o grid...");

    // 1. Data Sanitization
    let dateStr = "";
    const rawDate = rdo.data_rdo;
    if (rawDate instanceof Date) {
        dateStr = format(rawDate, 'yyyy-MM-dd');
    } else {
        dateStr = String(rawDate).split('T')[0];
    }

    // 2. Número Sequencial
    let sequenceNumber = "01";
    if (rdoList && rdoList.length > 0) {
        const sorted = [...rdoList].sort((a, b) => a.data_rdo.localeCompare(b.data_rdo));
        const index = sorted.findIndex(item => item.id === rdo.id);
        if (index !== -1) {
            sequenceNumber = (index + 1).toString().padStart(2, '0');
        }
    }

    // 3. Pre-fetching de Imagens
    const [logoBase64, responsibleSigBase64, clientSigBase64] = await Promise.all([
        urlToBase64(profile?.avatar_url || SYSTEM_LOGO_URL),
        urlToBase64(rdo.responsible_signature_url),
        urlToBase64(rdo.client_signature_url)
    ]);

    // Consolidar fotos de Atividades e Checklist de Segurança
    const rawPhotos = [
        ...(rdo.rdo_atividades_detalhe?.filter(a => a.foto_anexo_url).map(a => ({ 
            url: a.foto_anexo_url!, 
            desc: a.descricao_servico 
        })) || []),
        { url: (rdo as any).safety_nr35_photo, desc: "Segurança: NR-35" },
        { url: (rdo as any).safety_epi_photo, desc: "Segurança: EPIs" },
        { url: (rdo as any).safety_cleaning_photo, desc: "Segurança: Limpeza" },
        { url: (rdo as any).safety_dds_photo, desc: "Segurança: DDS" }
    ].filter(p => p.url && typeof p.url === 'string');

    const photosWithBase64 = await Promise.all(rawPhotos.map(async (p) => ({
        desc: p.desc,
        base64: await urlToBase64(p.url)
    })));

    // 4. Renderização
    const blob = await pdf(
      React.createElement(RdoPdfTemplate, { 
        rdo: { ...rdo, data_rdo: dateStr }, 
        obraNome, 
        profile, 
        obra, 
        sequenceNumber,
        logoBase64,
        photosBase64: photosWithBase64,
        responsibleSigBase64,
        clientSigBase64
      })
    ).toBlob();

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `RDO_${sequenceNumber}_${dateStr}_${obraNome.replace(/\s/g, '_')}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
  } catch (error) {
    console.error("[PDF Generator] Erro Crítico:", error);
    throw new Error("Falha técnica ao gerar PDF. Certifique-se de salvar o RDO antes.");
  }
};