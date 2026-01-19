import { pdf } from '@react-pdf/renderer';
import React from 'react';
import { DiarioObra } from "@/hooks/use-rdo";
import { Profile } from "@/hooks/use-profile";
import { Obra } from "@/hooks/use-obras";
import { RdoPdfTemplate } from "@/components/rdo/RdoPdfTemplate";
import { format, parseISO, isValid, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";

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

const gatherAllPhotos = (rdo: DiarioObra) => {
  const photos: { desc: string; url: string }[] = [];
  rdo.rdo_atividades_detalhe?.forEach(atv => {
    if (atv.foto_anexo_url) {
      photos.push({ desc: `Serviço: ${atv.descricao_servico}`, url: atv.foto_anexo_url });
    }
  });
  rdo.rdo_equipamentos?.forEach(eqp => {
    if (eqp.foto_url) {
      photos.push({ desc: `Máquina: ${eqp.equipamento}`, url: eqp.foto_url });
    }
  });
  if (rdo.safety_nr35_photo) photos.push({ desc: "Segurança: Trabalho em Altura", url: rdo.safety_nr35_photo });
  if (rdo.safety_epi_photo) photos.push({ desc: "Segurança: Uso de EPIs", url: rdo.safety_epi_photo });
  if (rdo.safety_cleaning_photo) photos.push({ desc: "Segurança: Organização/Limpeza", url: rdo.safety_cleaning_photo });
  if (rdo.safety_dds_photo) photos.push({ desc: "Segurança: Registro de DDS", url: rdo.safety_dds_photo });
  return photos;
};

export const generateRdoPdf = async (
  rdo: DiarioObra, 
  obraNome: string, 
  profile: Profile | null, 
  obra?: Obra,
  rdoList?: DiarioObra[]
) => {
  try {
    console.log("[PDF Engine] Starting reconstruction...");

    let sequenceNumber = "01";
    if (rdoList) {
        const sorted = [...rdoList].sort((a, b) => a.data_rdo.localeCompare(b.data_rdo));
        const index = sorted.findIndex(item => item.id === rdo.id);
        if (index !== -1) sequenceNumber = (index + 1).toString().padStart(2, '0');
    }

    // Contract Status Logic
    let contractStats = { total: 0, elapsed: 0, remaining: 0, hasDeadline: false };
    if (obra?.data_inicio && obra?.previsao_entrega) {
        const start = parseISO(obra.data_inicio);
        const deadline = parseISO(obra.previsao_entrega);
        const current = parseISO(rdo.data_rdo);
        
        if (isValid(start) && isValid(deadline)) {
            contractStats.total = differenceInDays(deadline, start);
            contractStats.elapsed = differenceInDays(current, start);
            contractStats.remaining = differenceInDays(deadline, current);
            contractStats.hasDeadline = true;
        }
    }

    const [logoBase64, responsibleSigBase64, clientSigBase64] = await Promise.all([
        urlToBase64(profile?.avatar_url),
        urlToBase64(rdo.responsible_signature_url),
        urlToBase64(rdo.client_signature_url)
    ]);

    const allRawPhotos = gatherAllPhotos(rdo);
    const processedPhotos = [];
    for (const p of allRawPhotos.slice(0, 18)) {
        const b64 = await urlToBase64(p.url);
        if (b64) processedPhotos.push({ desc: p.desc, base64: b64 });
    }

    const dateObj = parseISO(rdo.data_rdo);
    const dayOfWeek = isValid(dateObj) ? format(dateObj, "EEEE", { locale: ptBR }) : "";

    const blob = await pdf(
      React.createElement(RdoPdfTemplate, { 
        rdo, 
        obraNome: obraNome || "Obra", 
        profile, 
        obra, 
        sequenceNumber,
        dayOfWeek,
        logoBase64,
        photosBase64: processedPhotos,
        responsibleSigBase64,
        clientSigBase64,
        contractStats
      })
    ).toBlob();

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `RDO_${sequenceNumber}_${obraNome.replace(/\s/g, '_')}_${rdo.data_rdo}.pdf`;
    document.body.appendChild(link);
    link.click();
    
    setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }, 100);
    
  } catch (error) {
    console.error("[PDF Engine] Critical Failure:", error);
    throw new Error(`Erro ao gerar PDF: ${error instanceof Error ? error.message : 'Verifique os anexos.'}`);
  }
};