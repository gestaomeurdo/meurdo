import { pdf } from '@react-pdf/renderer';
import { DiarioObra } from "@/hooks/use-rdo";
import { Profile } from "@/hooks/use-profile";
import { Obra } from "@/hooks/use-obras";
import { RdoPdfTemplate } from "@/components/rdo/RdoPdfTemplate";
import { formatDate } from "./formatters";

export const generateRdoPdf = async (
  rdo: DiarioObra, 
  obraNome: string, 
  profile: Profile | null, 
  obra?: Obra,
  rdoList?: DiarioObra[]
) => {
  try {
    // Cálculo do Número Sequencial
    let sequenceNumber = "01";
    if (rdoList && rdoList.length > 0) {
        const sorted = [...rdoList].sort((a, b) => a.data_rdo.localeCompare(b.data_rdo));
        const index = sorted.findIndex(item => item.id === rdo.id);
        if (index !== -1) {
            sequenceNumber = (index + 1).toString().padStart(2, '0');
        }
    }

    // DEBUG: Verificando fotos antes de renderizar
    const photosToLog = [
        ...(rdo.rdo_atividades_detalhe?.filter(a => a.foto_anexo_url).map(a => a.foto_anexo_url) || []),
        (rdo as any).safety_nr35_photo,
        (rdo as any).safety_epi_photo,
        (rdo as any).safety_cleaning_photo,
        (rdo as any).safety_dds_photo
    ].filter(Boolean);
    
    console.log(`[PDF Generator] Gerando RDO #${sequenceNumber} para ${obraNome}`);
    console.log(`[PDF Generator] URLs das Fotos encontradas:`, photosToLog);
    console.log(`[PDF Generator] Logo da Empresa:`, profile?.avatar_url || 'Uso da logo padrão');

    const blob = await pdf(
      RdoPdfTemplate({ rdo, obraNome, profile, obra, sequenceNumber })
    ).toBlob();

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    const dateStr = formatDate(rdo.data_rdo).replace(/\//g, '-');
    const safeObraName = obraNome.replace(/[^a-zA-Z0-9]/g, '_');
    link.download = `RDO_${sequenceNumber}_${dateStr}_${safeObraName}.pdf`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    console.log("[PDF Generator] PDF gerado e download iniciado.");
  } catch (error) {
    console.error("[PDF Generator] Erro fatal:", error);
    throw new Error("Falha ao gerar o PDF. Verifique se as imagens estão acessíveis e tente novamente.");
  }
};