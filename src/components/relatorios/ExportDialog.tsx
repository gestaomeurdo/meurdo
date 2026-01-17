import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileText, Download, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { showError, showSuccess } from "@/utils/toast";
import { Obra } from "@/hooks/use-obras";
import { RdoReportMetrics } from '@/hooks/use-rdo-report-data';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { DiarioObra } from '@/hooks/use-rdo';
import { useAuth } from '@/integrations/supabase/auth-provider';
import { format } from "date-fns";

interface ExportDialogProps {
  obraNome: string;
  periodo: string;
  reportData: RdoReportMetrics | undefined;
  activities: DiarioObra[] | undefined;
  kmCost: number | undefined;
  isLoading: boolean;
  selectedObra: Obra | undefined;
}

const DEFAULT_LOGO = "https://meurdo.com.br/wp-content/uploads/2026/01/Logo-MEU-RDO-scaled.png";
const ICON_URL = "https://meurdo.com.br/wp-content/uploads/2026/01/Icone.png";

const ExportDialog = ({ obraNome, periodo, reportData, activities: rdoList, isLoading, selectedObra }: ExportDialogProps) => {
  const [isExporting, setIsExporting] = useState(false);
  const [open, setOpen] = useState(false);
  const { profile } = useAuth();
  const isPro = profile?.subscription_status === 'active' || profile?.plan_type === 'pro';
  const userLogo = profile?.avatar_url;

  const handleExportPdf = async () => {
    if (!reportData || !selectedObra || !rdoList) {
      showError("Dados do relatório não estão disponíveis.");
      return;
    }

    setIsExporting(true);
    
    try {
      const doc = new jsPDF();
      let y = 25;
      const margin = 15;
      const lineHeight = 6;
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      
      const loadImg = (url: string): Promise<HTMLImageElement | null> => {
        return new Promise((resolve) => {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.src = url;
          img.onload = () => resolve(img);
          img.onerror = () => resolve(null);
          setTimeout(() => resolve(null), 3000);
        });
      };

      const mainLogo = await loadImg(userLogo && isPro ? userLogo : DEFAULT_LOGO);
      const brandIcon = await loadImg(ICON_URL);

      if (mainLogo) {
        const ratio = mainLogo.width / mainLogo.height;
        const logoHeight = 15;
        const logoWidth = logoHeight * ratio;
        doc.addImage(mainLogo, 'PNG', margin, y - 10, Math.min(logoWidth, 60), logoHeight);
      }
      
      doc.setFontSize(18);
      doc.setTextColor(6, 106, 188); 
      doc.setFont("helvetica", "bold");
      doc.text("RELATÓRIO SIMPLIFICADO DE OBRA", pageWidth - margin, y - 5, { align: 'right' });
      
      y += 10;
      doc.setDrawColor(6, 106, 188);
      doc.setLineWidth(1);
      doc.line(margin, y, pageWidth - margin, y);
      
      y += 10;
      doc.setFontSize(10);
      doc.setTextColor(50);
      doc.setFont("helvetica", "bold");
      doc.text(`OBRA:`, margin, y);
      doc.setFont("helvetica", "normal");
      doc.text(obraNome.toUpperCase(), margin + 15, y);
      
      doc.setFont("helvetica", "bold");
      doc.text(`PERÍODO:`, 110, y);
      doc.setFont("helvetica", "normal");
      doc.text(periodo, 130, y);
      
      y += 6;
      doc.setFont("helvetica", "bold");
      doc.text(`STATUS:`, margin, y);
      doc.setFont("helvetica", "normal");
      doc.text(selectedObra.status.charAt(0).toUpperCase() + selectedObra.status.slice(1), margin + 15, y);
      
      y += 15;

      doc.setFontSize(14);
      doc.setTextColor(6, 106, 188);
      doc.text("Resumo de Progresso", margin, y);
      y += 5;
      doc.setDrawColor(200);
      doc.line(margin, y, pageWidth - margin, y);
      y += 10;
      
      doc.setFontSize(10);
      doc.setTextColor(50);
      doc.setFont("helvetica", "bold");
      
      const totalRdos = rdoList.length;
      
      doc.text(`Dias Trabalhados (RDOs):`, margin, y);
      doc.setFont("helvetica", "normal");
      doc.text(`${totalRdos}`, margin + 60, y);
      y += lineHeight;
      
      doc.setFont("helvetica", "bold");
      doc.text(`Total de Efetivo (Homem-Dia):`, margin, y);
      doc.setFont("helvetica", "normal");
      doc.text(`${reportData.totalManpower}`, margin + 60, y);
      y += lineHeight;
      
      doc.setFont("helvetica", "bold");
      doc.text(`Dias de Chuva/Paralisação:`, margin, y);
      doc.setFont("helvetica", "normal");
      doc.text(`${reportData.rainDays}`, margin + 60, y);
      y += lineHeight;
      
      doc.setFont("helvetica", "bold");
      doc.text(`Atividades Concluídas (100%):`, margin, y);
      doc.setFont("helvetica", "normal");
      doc.text(`${reportData.completedActivitiesCount}`, margin + 60, y);
      y += lineHeight * 2;

      doc.setFontSize(14);
      doc.setTextColor(6, 106, 188);
      doc.text("Ocorrências e Observações Recentes", margin, y);
      y += 5;
      doc.line(margin, y, pageWidth - margin, y);
      y += 10;
      
      const topOccurrences = reportData.occurrenceTimeline.slice(0, 5);
      
      if (topOccurrences.length === 0) {
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text("Nenhuma ocorrência importante registrada no período.", margin, y);
        y += lineHeight;
      } else {
        topOccurrences.forEach((item) => {
          if (y > pageHeight - margin * 3) {
            doc.addPage();
            y = margin + 10;
          }
          doc.setFontSize(10);
          doc.setTextColor(50);
          doc.setFont("helvetica", "bold");
          doc.text(`[${formatDate(item.date)}]`, margin, y);
          doc.setFont("helvetica", "normal");
          const textLines = doc.splitTextToSize(item.comments, pageWidth - margin - 35);
          doc.text(textLines, margin + 30, y);
          y += (textLines.length * lineHeight) + 4;
        });
      }
      
      const allPhotos = rdoList.flatMap(rdo => 
        rdo.rdo_atividades_detalhe?.filter(a => a.foto_anexo_url).map(a => ({
          url: a.foto_anexo_url!,
          date: rdo.data_rdo,
          description: a.descricao_servico,
        })) || []
      );
      
      if (allPhotos.length > 0) {
        doc.addPage();
        y = margin + 10;
        doc.setFontSize(18);
        doc.setTextColor(6, 106, 188);
        doc.setFont("helvetica", "bold");
        doc.text("GALERIA DE FOTOS DO PERÍODO", pageWidth / 2, y, { align: 'center' });
        y += 5;
        doc.line(margin, y, pageWidth - margin, y);
        y += 10;
        
        const imgWidth = 80;
        const imgHeight = 60;
        const padding = 10;
        let x = margin;
        
        for (const photo of allPhotos) {
          if (y + imgHeight + 20 > pageHeight - margin) {
            doc.addPage();
            y = margin + 10;
            x = margin;
          }
          
          try {
            const img = await loadImg(photo.url);
            if (img) {
              doc.addImage(img, 'PNG', x, y, imgWidth, imgHeight);
              
              doc.setFontSize(8);
              doc.setTextColor(50);
              doc.setFont("helvetica", "bold");
              doc.text(formatDate(photo.date), x, y + imgHeight + 4);
              doc.setFont("helvetica", "normal");
              
              const descriptionLines = doc.splitTextToSize(photo.description, imgWidth);
              doc.text(descriptionLines, x, y + imgHeight + 8);
              
              x += imgWidth + padding;
              if (x > pageWidth - margin - imgWidth) {
                x = margin;
                y += imgHeight + 25;
              }
            }
          } catch (e) {
            console.error("Failed to add image to PDF:", e);
          }
        }
      }

      if (!isPro) {
        doc.setGState(new (doc as any).GState({ opacity: 0.1 }));
        if (brandIcon) {
            doc.addImage(brandIcon, 'PNG', (pageWidth / 2) - 25, (pageHeight / 2) - 25, 50, 50);
        }
        doc.setGState(new (doc as any).GState({ opacity: 1 }));
        doc.setFontSize(8);
        doc.setTextColor(180);
        doc.text("Documento gerado pela plataforma MEU RDO (Versão Gratuita)", pageWidth / 2, pageHeight - 10, { align: 'center' });
      }

      const filename = `Relatorio_Simplificado_${obraNome.replace(/\s/g, '_')}.pdf`;
      doc.save(filename);
      showSuccess("Relatório PDF gerado com sucesso!");
      setOpen(false);

    } catch (error) {
      console.error("PDF generation error:", error);
      showError(`Falha ao gerar PDF: ${error instanceof Error ? error.message : "Erro desconhecido"}`);
    } finally {
      setIsExporting(false);
    }
  };

  const isDataReady = !!reportData && !!selectedObra && !!rdoList;
  const isDisabled = isLoading || isExporting || !isDataReady;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button disabled={isDisabled}>
          {isLoading || isExporting ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <FileText className="w-4 h-4 mr-2" />
          )}
          {isLoading ? "Carregando Dados..." : "Gerar Relatório PDF"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Exportar Relatório Simplificado</DialogTitle>
          <DialogDescription>
            Gere um resumo técnico de {obraNome} para o período de {periodo}.
          </DialogDescription>
        </DialogHeader>
        <div className="py-6 flex flex-col items-center justify-center border rounded-xl bg-muted/30">
          <FileText className="w-12 h-12 text-primary mb-3" />
          <h3 className="font-bold text-lg">Resumo Técnico de Campo</h3>
          <p className="text-xs text-muted-foreground text-center px-6 mt-1">
            Inclui KPIs de efetivo, clima, ocorrências e galeria de fotos anexadas nos RDOs.
          </p>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isExporting}>
            Cancelar
          </Button>
          <Button 
            type="button" 
            onClick={handleExportPdf} 
            disabled={isExporting || !isDataReady}
          >
            {isExporting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Download className="w-4 h-4 mr-2" />
            )}
            {isExporting ? "Gerando..." : "Baixar PDF"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ExportDialog;