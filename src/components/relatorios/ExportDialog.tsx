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

interface ExportDialogProps {
  obraNome: string;
  periodo: string;
  reportData: ReportData | undefined;
  activities: AtividadeWithProfile[] | undefined;
  kmCost: number | undefined;
  isLoading: boolean;
}

const ExportDialog = ({ obraNome, periodo, reportData, activities, kmCost, isLoading }: ExportDialogProps) => {
  const [isExporting, setIsExporting] = useState(false);

  const handleExportPdf = () => {
    if (!reportData || !activities) {
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

      // --- Header ---
      doc.setFontSize(18);
      doc.text(`Relatório de Atividades - ${obraNome}`, margin, y);
      y += lineHeight;
      
      doc.setFontSize(12);
      doc.text(`Período: ${periodo}`, margin, y);
      y += lineHeight * 2;

      // --- Summary ---
      const currentKmCost = kmCost || 1.50;
      const totalKmCost = (reportData.totalMileagePeriod || 0) * currentKmCost;
      const totalActivityCost = (reportData.totalTollsPeriod || 0) + totalKmCost;

      doc.setFontSize(14);
      doc.text("Resumo de Custos", margin, y);
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
      doc.text("Detalhes das Atividades (Lista)", margin, y);
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
          doc.text(`--- Atividade ${index + 1} ---`, margin, y);
          y += lineHeight;
          
          doc.setFontSize(10);
          
          // Bullet list items
          doc.text(`• Atividade realizada: ${atividade.descricao}`, margin + 5, y, { maxWidth: pageWidth - margin * 2 - 5 });
          y += lineHeight;
          doc.text(`• Data: ${formatDate(atividade.data_atividade)} (Status: ${atividade.status})`, margin + 5, y);
          y += lineHeight;
          doc.text(`• Responsável: ${responsibleName}`, margin + 5, y);
          y += lineHeight;
          doc.text(`• Valor gasto (Pedágio + KM): ${formatCurrency(activityTotalCost)}`, margin + 5, y);
          y += lineHeight;
          doc.text(`• Detalhe de Custos: Pedágio (${formatCurrency(atividade.pedagio)}) + KM (${(atividade.km_rodado || 0).toFixed(0)} km @ ${formatCurrency(currentKmCost)}/km)`, margin + 5, y);
          y += lineHeight;
          
          // Campos não disponíveis no esquema atual
          doc.text(`• Materiais utilizados: N/A (Não registrado)`, margin + 5, y);
          y += lineHeight;
          doc.text(`• Horas trabalhadas: N/A (Não registrado)`, margin + 5, y);
          y += lineHeight;
          doc.text(`• Observações gerais: N/A`, margin + 5, y);
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
  const isDataReady = !!reportData && !!activities;
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
          <Button type="button" variant="secondary">Cancelar</Button>
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