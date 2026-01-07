import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, Loader2, AlertTriangle, CheckCircle, Clipboard } from "lucide-react";
import { useState } from "react";
import Papa from 'papaparse';
import { useAuth } from "@/integrations/supabase/auth-provider";
import { importFinancialEntries, RawCostEntry } from "@/utils/importer";
import { showError, showSuccess } from "@/utils/toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useQueryClient } from "@tanstack/react-query";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface PasteImportDialogProps {
  trigger: React.ReactNode;
}

const PasteImportDialog = ({ trigger }: PasteImportDialogProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [csvContent, setCsvContent] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [importResult, setImportResult] = useState<{ successCount: number, errorCount: number, totalCount: number } | null>(null);
  const [open, setOpen] = useState(false);

  const handleImport = () => {
    if (!csvContent || !user) {
      showError("Cole o conteúdo do CSV na caixa de texto e certifique-se de estar logado.");
      return;
    }

    setIsLoading(true);
    setImportResult(null);

    // Use PapaParse to process the pasted text
    Papa.parse(csvContent, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false,
      delimiter: '', // Permite detecção automática de delimitador (vírgula, ponto e vírgula, tabulação)
      complete: async (results) => {
        // Filter lines that have Descricao and either Pagamentos or Valor
        const rawEntries = (results.data as RawCostEntry[]).filter(e => 
          e.Descricao && (e.Pagamentos || e.Valor)
        );
        const totalCount = rawEntries.length;

        if (totalCount === 0) {
          showError("O conteúdo colado está vazio ou não contém lançamentos válidos nas colunas esperadas (Data, Descricao, Valor/Pagamentos).");
          setIsLoading(false);
          return;
        }

        try {
          const { successCount, errorCount } = await importFinancialEntries(rawEntries, user.id);
          
          setImportResult({ successCount, errorCount, totalCount });
          showSuccess(`Importação concluída! ${successCount} lançamentos adicionados.`);
          
          // Invalida consultas relevantes para atualizar o dashboard e financeiro
          queryClient.invalidateQueries({ queryKey: ['financialEntries'] });
          queryClient.invalidateQueries({ queryKey: ['obras'] });
          queryClient.invalidateQueries({ queryKey: ['dashboardData'] });

        } catch (error) {
          showError(`Falha na importação: ${error instanceof Error ? error.message : "Erro desconhecido"}`);
          setImportResult({ successCount: 0, errorCount: totalCount, totalCount });
        } finally {
          setIsLoading(false);
          setCsvContent(""); // Clear content after attempt
        }
      },
      error: (error) => {
        showError(`Erro ao processar o conteúdo: ${error.message}`);
        setIsLoading(false);
      }
    });
  };

  const isButtonDisabled = !csvContent || isLoading;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Importação de Dados Financeiros (Copiar/Colar)</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <Alert variant="default">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Instruções de Colagem</AlertTitle>
            <AlertDescription>
              <p>1. Abra seu arquivo CSV/Excel.</p>
              <p>2. Copie as colunas de dados, **incluindo o cabeçalho** (Data, Descrição, Valor/Pagamentos).</p>
              <p>3. Cole o conteúdo bruto na caixa abaixo. O sistema tentará **detectar automaticamente** o separador (vírgula, ponto e vírgula ou tabulação).</p>
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="csv-paste" className="block text-sm font-medium">Cole o conteúdo do CSV aqui:</Label>
            <Textarea 
              id="csv-paste"
              rows={10}
              placeholder="Cole as linhas do CSV aqui..."
              value={csvContent}
              onChange={(e) => {
                setCsvContent(e.target.value);
                setImportResult(null);
              }}
              disabled={isLoading}
            />
          </div>

          {importResult && (
            <Alert className={importResult.successCount > 0 ? "border-green-500" : "border-destructive"}>
              <AlertTitle className="flex items-center">
                {importResult.successCount > 0 ? <CheckCircle className="h-4 w-4 mr-2 text-green-500" /> : <AlertTriangle className="h-4 w-4 mr-2 text-destructive" />}
                Resultado da Importação
              </AlertTitle>
              <AlertDescription className="space-y-1">
                <p>Total de linhas processadas: <span className="font-bold">{importResult.totalCount}</span></p>
                <p className="text-green-500">Sucesso: <span className="font-bold">{importResult.successCount}</span></p>
                {importResult.errorCount > 0 && (
                  <p className="text-destructive">Erros/Duplicados: <span className="font-bold">{importResult.errorCount}</span></p>
                )}
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Fechar</Button>
          <Button 
            onClick={handleImport} 
            disabled={isButtonDisabled}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processando...
              </>
            ) : (
              <>
                <Clipboard className="mr-2 h-4 w-4" />
                Processar Conteúdo
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PasteImportDialog;