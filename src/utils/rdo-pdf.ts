import { pdf } from '@react-pdf/renderer';
import React from 'react';
import { DiarioObra } from "@/hooks/use-rdo";
import { Profile } from "@/hooks/use-profile";
import { Obra } from "@/hooks/use-obras";
import { RdoPdfTemplate } from "@/components/rdo/RdoPdfTemplate";
import { format, parseISO, isValid } from "date-fns";

async function urlToBase64(url: string | null | undefined): Promise<string | null> {
  if (!url || typeof url !== 'string' || url.trim() === '' || url.includes('null')) return null;
  
  try {
    const response = await fetch(url, { 
      mode: 'cors',
      cache: 'default'
    });
    
    if (!response.ok) return null;
    
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.warn(`[PDF Preflight] Ignorando imagem com erro: ${url}`);
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
    console.log("[PDF Generator] Iniciando processamento resiliente...");

    // 1. Sanitização de Data (Evita erro de 'Invalid Date')
    let sequenceNumber = "01";
    if (rdoList && rdoList.length > 0) {
        const sorted = [...rdoList].sort((a, b) => a.data_rdo.localeCompare(b.data_rdo));
        const index = sorted.findIndex(item => item.id === rdo.id);
        if (index !== -1) {
            sequenceNumber = (index + 1).toString().padStart(2, '0');
        }
    }

    // 2. DATA HARVESTING (Varrer antes de converter)
    const rawPhotos = [
        ...(rdo.rdo_atividades_detalhe?.filter(a => a.foto_anexo_url).map(a => ({ 
            url: a.foto_anexo_url!, 
            desc: `Serviço: ${a.descricao_servico}` 
        })) || []),
        
        ...(rdo.rdo_equipamentos?.filter(e => (e as any).foto_url).map(e => ({
            url: (e as any).foto_url!,
            desc: `Máquina: ${e.equipamento}`
        })) || []),

        { url: (rdo as any).safety_nr35_photo, desc: "Segurança: Registro NR-35" },
        { url: (rdo as any).safety_epi_photo, desc: "Segurança: Uso de EPIs" },
        { url: (rdo as any).safety_cleaning_photo, desc: "Segurança: Limpeza" },
        { url: (rdo as any).safety_dds_photo, desc: "Segurança: Registro de DDS" }
    ].filter(p => p.url && typeof p.url === 'string' && p.url.startsWith('http'));

    // 3. CONVERSÃO EM MASSA (Resiliente: não trava se uma falhar)
    const [logoBase64, responsibleSigBase64, clientSigBase64] = await Promise.all([
        urlToBase64(profile?.avatar_url),
        urlToBase64(rdo.responsible_signature_url),
        urlToBase64(rdo.client_signature_url)
    ]);

    const processedPhotos = [];
    for (const p of rawPhotos) {
        const b64 = await urlToBase64(p.url);
        if (b64) processedPhotos.push({ desc: p.desc, base64: b64 });
    }

    // 4. Renderização
    const blob = await pdf(
      React.createElement(RdoPdfTemplate, { 
        rdo, 
        obraNome: obraNome || "Obra sem nome", 
        profile, 
        obra, 
        sequenceNumber,
        logoBase64,
        photosBase64: processedPhotos,
        responsibleSigBase64,
        clientSigBase64
      })
    ).toBlob();

    const fileNameDate = typeof rdo.data_rdo === 'string' ? rdo.data_rdo : 'relatorio';
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `RDO_${sequenceNumber}_${obraNome.replace(/\s/g, '_')}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
  } catch (error) {
    console.error("[PDF Generator] Erro Fatal:", error);
    throw new Error("Ocorreu um erro ao processar o PDF. Verifique se as imagens anexadas são válidas.");
  }
};