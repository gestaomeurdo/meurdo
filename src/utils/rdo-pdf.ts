import { pdf } from '@react-pdf/renderer';
import { DiarioObra } from "@/hooks/use-rdo";
import { Profile } from "@/hooks/use-profile";
import { RdoPdfTemplate } from "@/components/rdo/RdoPdfTemplate";
import { formatDate } from "./formatters";

export const generateRdoPdf = async (rdo: DiarioObra, obraNome: string, profile: Profile | null) => {
  try {
    const blob = await pdf(
      RdoPdfTemplate({ rdo, obraNome, profile })
    ).toBlob();

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    const dateStr = formatDate(rdo.data_rdo).replace(/\//g, '-');
    const safeObraName = obraNome.replace(/[^a-zA-Z0-9]/g, '_');
    link.download = `RDO_${dateStr}_${safeObraName}.pdf`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Error generating PDF:", error);
    throw new Error("Falha ao gerar o PDF. Tente novamente.");
  }
};