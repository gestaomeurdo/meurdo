import { pdf } from '@react-pdf/renderer';
import { DiarioObra } from "@/hooks/use-rdo";
import { Profile } from "@/hooks/use-profile";
import { Obra } from "@/hooks/use-obras";
import { RdoPdfTemplate } from "@/components/rdo/RdoPdfTemplate";
import { formatDate } from "./formatters";

const SYSTEM_LOGO_URL = "https://meurdo.com.br/wp-content/uploads/2026/01/Logo-MEU-RDO-scaled.png";

/**
 * Converte uma URL de imagem para Base64 para evitar bloqueios de CORS no PDF.
 */
async function urlToBase64(url: string | null | undefined): Promise<string | null> {
  if (!url || typeof url !== 'string' || url.trim() === '') return null;
  
  try {
    const response = await fetch(url, { 
      mode: 'cors',
      cache: 'no-cache'
    });
    
    if (!response.ok) {
        console.warn(`[PDF Preflight] Falha ao baixar imagem: ${url} (Status: ${response.status})`);
        return null;
    }
    
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error("Erro ao ler blob de imagem"));
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error(`[PDF Preflight] Erro CORS ou de conexão ao baixar imagem: ${url}`, error);
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
    console.log("[PDF Generator] Iniciando preparação de ativos Base64...");

    // 1. Cálculo do Número Sequencial
    let sequenceNumber = "01";
    if (rdoList && rdoList.length > 0) {
        const sorted = [...rdoList].sort((a, b) => a.data_rdo.localeCompare(b.data_rdo));
        const index = sorted.findIndex(item => item.id === rdo.id);
        if (index !== -1) {
            sequenceNumber = (index + 1).toString().padStart(2, '0');
        }
    }

    // 2. Pre-fetching da Logo (Cliente ou Sistema)
    const logoBase64 = await urlToBase64(profile?.avatar_url || SYSTEM_LOGO_URL);

    // 3. Pre-fetching de Todas as Fotos do RDO
    const rawPhotos = [
        ...(rdo.rdo_atividades_detalhe?.filter(a => a.foto_anexo_url).map(a => ({ url: a.foto_anexo_url!, desc: a.descricao_servico })) || []),
        { url: (rdo as any).safety_nr35_photo, desc: "Segurança: NR-35" },
        { url: (rdo as any).safety_epi_photo, desc: "Segurança: EPIs" },
        { url: (rdo as any).safety_cleaning_photo, desc: "Segurança: Limpeza" },
        { url: (rdo as any).safety_dds_photo, desc: "Segurança: DDS" }
    ].filter(p => p.url && p.url.trim() !== "");

    const photosWithBase64 = await Promise.all(rawPhotos.map(async (p) => ({
        desc: p.desc,
        base64: await urlToBase64(p.url)
    })));

    // 4. Pre-fetching de Assinaturas
    const responsibleSigBase64 = await urlToBase64(rdo.responsible_signature_url);
    const clientSigBase64 = await urlToBase64(rdo.client_signature_url);

    // 5. Renderização do PDF com Dados "Blindados"
    const blob = await pdf(
      RdoPdfTemplate({ 
        rdo, 
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
    
    const dateStr = formatDate(rdo.data_rdo).replace(/\//g, '-');
    const safeObraName = obraNome.replace(/[^a-zA-Z0-9]/g, '_');
    link.download = `RDO_${sequenceNumber}_${dateStr}_${safeObraName}.pdf`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    console.log("[PDF Generator] PDF finalizado e enviado para download.");
  } catch (error) {
    console.error("[PDF Generator] Erro Crítico:", error);
    throw new Error("Erro na geração do PDF. Tente novamente em instantes.");
  }
};