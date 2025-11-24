import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileText, Download, Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";
import { useAuth } from "@/integrations/supabase/auth-provider";
import { showError, showSuccess } from "@/utils/toast";

interface ExportDialogProps {
  obraNome: string;
  obraId: string;
  periodo: string;
  startDate: string;
  endDate: string;
}

const ExportDialog = ({ obraNome, obraId, periodo, startDate, endDate }: ExportDialogProps) => {
  const [isExporting, setIsExporting] = useState(false);
  const [activeTab, setActiveTab] = useState<'pdf' | 'csv'>('csv');
  const { session } = useAuth();

  const handleExportCsv = async () => {
    if (!session) {
      showError("Você precisa estar logado para exportar dados.");
      return;
    }
    
    setIsExporting(true);
    
    try {
      // NOTE: Replace with your actual Supabase Project ID
      const SUPABASE_PROJECT_ID = "edguowimanbdjyubspas";
      const EDGE_FUNCTION_URL = `https://${SUPABASE_PROJECT_ID}.supabase.co/functions/v1/export-activities-csv`;

      const response = await fetch(EDGE_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          obraId,
          startDate,
          endDate,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erro na exportação: ${errorText}`);
      }

      // Get the filename from the Content-Disposition header if available, otherwise use a default
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = `relatorio_atividades_${startDate}_a_${endDate}.csv`;
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="(.+)"/);
        if (match && match[1]) {
          filename = match[1];
        }
      }

      // Create a blob from the response and trigger download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      showSuccess("Relatório CSV gerado e baixado com sucesso!");

    } catch (error) {
      console.error("Export error:", error);
      showError(`Falha ao exportar relatório: ${error instanceof Error ? error.message : "Erro desconhecido"}`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button disabled={isExporting}>
          {isExporting ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <FileText className="w-4 h-4 mr-2" />
          )}
          Exportar Relatório
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Exportar Relatório</DialogTitle>
          <DialogDescription>
            Exporte o relatório de {obraNome} para o período de {periodo}.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Tabs defaultValue="csv" onValueChange={(value) => setActiveTab(value as 'pdf' | 'csv')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="pdf">PDF (Em Breve)</TabsTrigger>
              <TabsTrigger value="csv">CSV (Dados Brutos)</TabsTrigger>
            </TabsList>
            <TabsContent value="pdf" className="mt-4">
              <div className="border rounded-lg p-4 h-64 bg-muted/50 flex flex-col items-center justify-center">
                <FileText className="w-16 h-16 text-muted-foreground mb-4" />
                <h3 className="font-semibold">Exportação de PDF (Em Breve)</h3>
                <p className="text-sm text-muted-foreground text-center">A geração de relatórios formatados em PDF com gráficos está em desenvolvimento.</p>
              </div>
            </TabsContent>
            <TabsContent value="csv" className="mt-4">
              <div className="border rounded-lg p-4 h-64 bg-muted/50 flex flex-col items-center justify-center">
                <p className="text-sm text-center text-muted-foreground">
                  Os dados de atividades (descrição, status, pedágio, KM rodado e custos calculados) serão exportados em formato de planilha (CSV).
                </p>
              </div>
            </TabsContent>
          </Tabs>
          <div className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="filename">Nome do Arquivo</Label>
              <Input id="filename" defaultValue={`Relatorio_Atividades_${obraNome.replace(/\s/g, '_')}_${periodo.replace(/\s/g, '')}`} readOnly />
            </div>
            {/* Removendo campos de email e agendamento para simplificar o escopo inicial */}
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="secondary" onClick={() => { /* Close dialog logic if needed */ }}>Cancelar</Button>
          <Button 
            type="button" 
            onClick={handleExportCsv} 
            disabled={isExporting || activeTab !== 'csv'}
          >
            {isExporting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Download className="w-4 h-4 mr-2" />
            )}
            {isExporting ? "Gerando CSV..." : "Gerar e Baixar CSV"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ExportDialog;