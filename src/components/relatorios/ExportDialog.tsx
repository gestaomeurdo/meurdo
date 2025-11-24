import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileText, Download, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { showError, showSuccess } from "@/utils/toast";
import jsPDF from 'jspdf';
import { ReportData } from "@/hooks/use-report-data";
import { Atividade } from "@/hooks/use-atividades";
import { formatCurrency, formatDate } from "@/utils/formatters";

interface ExportDialogProps {
  obraNome: string;
  periodo: string;
  reportData: ReportData | undefined;
  activities: Atividade[] | undefined;
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

      // Title
      doc.setFontSize(18);
      doc.text(`Relatório de Atividades - ${obraNome}`, margin, y);
      y += lineHeight;
      
      doc.setFontSize(12);
      doc.text(`Período: ${periodo}`, margin, y);
      y += lineHeight * 2;

      // Summary KPIs
      doc.setFontSize(14);
      doc.text("Resumo de Custos e Atividades", margin, y);
      y += lineHeight;
      
      doc.setFontSize(10);
      
      const totalKmCost = (reportData.totalMileagePeriod || 0) * (kmCost || 1.50);
      const totalActivityCost = (reportData.totalTollsPeriod || 0) + totalKmCost;

      doc.text(`Custo Total de Atividades: ${formatCurrency(totalActivityCost)}`, margin, y);
      doc.text(`Total Pedágio: ${formatCurrency(reportData.totalTollsPeriod)}`, pageWidth / 2, y);
      y += lineHeight;
      
      doc.text(`Total KM Rodado: ${(reportData.totalMileagePeriod || 0).toFixed(0)} km`, margin, y);
      doc.text(`Custo por KM: ${formatCurrency(kmCost)}`, pageWidth / 2, y);
      y += lineHeight;

      doc.text(`Atividades Concluídas: ${reportData.activitiesCompleted}`, margin, y);
      y += lineHeight * 2;

      // Activities Table
      doc.setFontSize(14);
      doc.text("Detalhes das Atividades", margin, y);
      y += lineHeight;

      const tableColumns = ["Data", "Status", "Pedágio (R$)", "KM Rodado", "Descrição"];
      const tableRows = activities.map(a => [
        formatDate(a.data_atividade),
        a.status,
        formatCurrency(a.pedagio, { currency: 'BRL', minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace('R$', '').trim(),
        (a.km_rodado || 0).toFixed(0),
        a.descricao.substring(0, 50) + (a.descricao.length > 50 ? '...' : ''),
      ]);

      (doc as any).autoTable({
        startY: y,
        head: [tableColumns],
        body: tableRows,
        theme: 'grid',
        styles: { fontSize: 8, cellPadding: 1.5 },
        headStyles: { fillColor: [255, 122, 0], textColor: [255, 255, 255] },
        margin: { left: margin, right: margin },
        columnStyles: {
          0: { cellWidth: 20 },
          1: { cellWidth: 20 },
          2: { cellWidth: 25, halign: 'right' },
          3: { cellWidth: 20, halign: 'right' },
          4: { cellWidth: 'auto' },
        }
      });

      // Save the PDF
      const filename = `Relatorio_Atividades_${obraNome.replace(/\s/g, '_')}_${periodo.replace(/\s/g, '')}.pdf`;
      doc.save(filename);

      showSuccess("Relatório PDF gerado e baixado com sucesso!");

    } catch (error) {
      console.error("PDF generation error:", error);
      showError(`Falha ao gerar relatório PDF: ${error instanceof Error ? error.message : "Erro desconhecido"}`);
    } finally {
      setIsExporting(false);
    }
  };

  // Check if data is ready for export
  const canExport = !isLoading && reportData && activities && activities.length > 0;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button disabled={isLoading || isExporting || !canExport}>
          {isLoading || isExporting ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <FileText className="w-4 h-4 mr-2" />
          )}
          {isLoading ? "Carregando Dados..." : "Exportar Relatório PDF"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Exportar Relatório PDF</DialogTitle>
          <DialogDescription>
            Gere o relatório formatado de {obraNome} para o período de {periodo}.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <div className="border rounded-lg p-4 h-48 bg-muted/50 flex flex-col items-center justify-center">
            <FileText className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="font-semibold">Relatório de Atividades em PDF</h3>
            <p className="text-sm text-muted-foreground text-center">
              O documento incluirá o resumo de custos e a lista detalhada de atividades.
            </p>
          </div>
          <div className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="filename">Nome do Arquivo</Label>
              <Input id="filename" defaultValue={`Relatorio_Atividades_${obraNome.replace(/\s/g, '_')}_${periodo.replace(/\s/g, '')}`} readOnly />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="secondary">Cancelar</Button>
          <Button 
            type="button" 
            onClick={handleExportPdf} 
            disabled={isExporting || !canExport}
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