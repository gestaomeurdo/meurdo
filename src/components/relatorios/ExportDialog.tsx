import jsPDF from 'jspdf';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileText, Download, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { showError, showSuccess } from "@/utils/toast";
import { ReportData } from "@/hooks/use-report-data";
import { AtividadeWithProfile } from "@/hooks/use-activities-in-period";
import { formatCurrency, formatDate } from "@/utils/formatters";
import { Obra } from "@/hooks/use-obras";

interface ExportDialogProps {
  obraNome: string;
  periodo: string;
  reportData: ReportData | undefined;
  activities: AtividadeWithProfile[] | undefined;
  kmCost: number | undefined;
  isLoading: boolean;
  selectedObra: Obra | undefined;
}

const LOGO_URL = "https://i.ibb.co/7dmMx016/Gemini-Generated-Image-qkvwxnqkvwxnqkvw-upscayl-2x-upscayl-standard-4x.png";

const ExportDialog = ({ obraNome, periodo, reportData, activities, kmCost, isLoading, selectedObra }: ExportDialogProps) => {
  const [isExporting, setIsExporting] = useState(false);

  const handleExportPdf = async () => {
    if (!reportData || !activities || !selectedObra) {
      showError("Dados do relatório não estão disponíveis.");
      return;
    }

    setIsExporting(true);
    
    try {
      const doc = new jsPDF();
      let y = 20;
      const margin = 10;
      const lineHeight = 7;
      const pageWidth = doc.internal.pageSize.getWidth();

      // --- Load Logo ---
      const logoImg = new Image();
      logoImg.src = LOGO_URL;
      
      // Wait for image to load (or timeout)
      await new Promise<void>((resolve) => {
          logoImg.onload = () => resolve();
          logoImg.onerror = () => resolve();
          setTimeout(resolve, 1000); 
      });

      // --- Header ---
      if (logoImg.complete && logoImg.naturalWidth > 0) {
          const logoWidth = 15;
          const logoHeight = 15;
          doc.addImage(logoImg, 'PNG', margin, y - 5, logoWidth, logoHeight);
          doc.setFontSize(18);
          doc.text(`Diário de Obra - Relatório`, margin + logoWidth + 5, y);
      } else {
          doc.setFontSize(18);
          doc.text(`Diário de Obra - Relatório`, margin, y);
      }
      y += lineHeight;
      
      doc.setFontSize(14);
      doc.text(`Obra: ${obraNome}`, margin, y);
      y += lineHeight;
      doc.text(`Período de Análise: ${periodo}`, margin, y);
      y += lineHeight * 2;

      // --- Overall Project Summary ---
      doc.setFontSize(16);
      doc.text("Resumo Geral da Obra", margin, y);
      y += lineHeight;
      
      doc.setFontSize(10);
      doc.text(`Status: ${selectedObra.status.charAt(0).toUpperCase() + selectedObra.status.slice(1)}`, margin, y);
      y += lineHeight;
      doc.text(`Orçamento Inicial: ${formatCurrency(reportData.initialBudget)}`, margin, y);
      y += lineHeight;
      doc.text(`Gasto Total (Acumulado): ${formatCurrency(reportData.totalSpentObra)}`, margin, y);
      y += lineHeight;
      doc.text(`Uso do Orçamento: ${reportData.budgetUsedPercent.toFixed(1)}%`, margin, y);
      y += lineHeight * 2;

      // --- Period Summary ---
      const currentKmCost = kmCost || 1.50;
      const totalKmCost = (reportData.totalMileagePeriod || 0) * currentKmCost;
      const totalActivityCost = (reportData.totalTollsPeriod || 0) + totalKmCost;

      doc.setFontSize(16);
      doc.text(`Métricas de Atividades no Período`, margin, y);
      y += lineHeight;
      
      doc.setFontSize(10);
      doc.text(`Custo Total de Atividades: ${formatCurrency(totalActivityCost)}`, margin, y);
      y += lineHeight;
      doc.text(`Total Pedágio: ${formatCurrency(reportData.totalTollsPeriod)}`, margin, y);
      y += lineHeight;
      doc.text(`Total KM Rodado: ${(reportData.totalMileagePeriod || 0).toFixed(0)} km (Custo: ${formatCurrency(totalKmCost)})`, margin, y);
      y += lineHeight;
      doc.text(`Atividades Concluídas: ${reportData.activitiesCompleted}`, margin, y);
      y += lineHeight * 2;

      // --- Activities List ---
      doc.setFontSize(14);
      doc.text("Detalhes das Atividades", margin, y);
      y += lineHeight;

      if (activities.length === 0) {
        doc.setFontSize(10);
        doc.text("Nenhuma atividade registrada neste período.", margin, y);
        y += lineHeight;
      } else {
        activities.forEach((atividade, index) => {
          const activityKmCost = (atividade.km_rodado || 0) * currentKmCost;
          const activityTotalCost = (atividade.pedagio || 0) + activityKmCost;
          
          const responsibleName = `${atividade.profiles?.first_name || ''} ${atividade.profiles?.last_name || ''}`.trim() || 'N/A';
          
          // Check if we need a new page
          if (y > doc.internal.pageSize.getHeight() - margin * 2) {
            doc.addPage();
            y = margin;
          }

          doc.setFontSize(12);
          doc.text(`--- Atividade ${index + 1} (${formatDate(atividade.data_atividade)}) ---`, margin, y);
          y += lineHeight;
          
          doc.setFontSize(10);
          
          // Bullet list items
          doc.text(`• Descrição: ${atividade.descricao}`, margin + 5, y, { maxWidth: pageWidth - margin * 2 - 5 });
          y += lineHeight;
          doc.text(`• Status: ${atividade.status}`, margin + 5, y);
          y += lineHeight;
          doc.text(`• Responsável: ${responsibleName}`, margin + 5, y);
          y += lineHeight;
          doc.text(`• Custo Total: ${formatCurrency(activityTotalCost)}`, margin + 5, y);
          y += lineHeight;
          doc.text(`• Detalhe: Pedágio (${formatCurrency(atividade.pedagio)}) + KM (${(atividade.km_rodado || 0).toFixed(0)} km)`, margin + 5, y);
          y += lineHeight * 1.5; // Extra space after each activity
        });
      }

      // Save the PDF
      const filename = `Relatorio_Atividades_Lista_${obraNome.replace(/\s/g, '_')}_${periodo.replace(/\s/g, '')}.pdf`;
      doc.save(filename);

      showSuccess("Relatório PDF em formato de lista gerado e baixado com sucesso!");

    } catch (error) {
      console.error("PDF generation error:", error);
      showError(`Falha ao gerar relatório PDF: ${error instanceof Error ? error.message : "Erro desconhecido"}`);
    } finally {
      setIsExporting(false);
    }
  };

  // The button should be disabled if data is loading or if reportData is missing (meaning no obra selected or RPC failed)
  const isDataReady = !!reportData && !!activities && !!selectedObra;
  const isDisabled = isLoading || isExporting || !isDataReady;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button disabled={isDisabled}>
          {isLoading || isExporting ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <FileText className="w-4 h-4 mr-2" />
          )}
          {isLoading ? "Carregando Dados..." : "Exportar Relatório PDF (Lista)"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Exportar Relatório PDF (Lista)</DialogTitle>
          <DialogDescription>
            Gere o relatório formatado de {obraNome} para o período de {periodo} em formato de lista.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <div className="border rounded-lg p-4 h-48 bg-muted/50 flex flex-col items-center justify-center">
            <FileText className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="font-semibold">Relatório de Atividades em Lista</h3>
            <p className="text-sm text-muted-foreground text-center">
              O documento será gerado em formato de lista simples, com os dados disponíveis.
            </p>
          </div>
          <div className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="filename">Nome do Arquivo</Label>
              <Input id="filename" defaultValue={`Relatorio_Atividades_Lista_${obraNome.replace(/\s/g, '_')}_${periodo.replace(/\s/g, '')}.pdf`} readOnly />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancelar</Button>
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
            {isExporting ? "Gerando PDF..." : "Gerar e Baixar PDF"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ExportDialog;