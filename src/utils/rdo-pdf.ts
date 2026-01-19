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
        // Ordena por data crescente para descobrir a posição deste RDO
        const sorted = [...rdoList].sort((a, b) => a.data_rdo.localeCompare(b.data_rdo));
        const index = sorted.findIndex(item => item.id === rdo.id);
        if (index !== -1) {
            sequenceNumber = (index + 1).toString().padStart(2, '0');
        }
    }

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
  } catch (error) {
    console.error("Error generating PDF:", error);
    throw new Error("Falha ao gerar o PDF. Verifique a conexão com o banco de imagens.");
  }
};