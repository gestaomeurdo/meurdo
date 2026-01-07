import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, Loader2, AlertTriangle, CheckCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import Papa from 'papaparse';
import { useAuth } from "@/integrations/supabase/auth-provider";
import { importFinancialEntries, RawCostEntry } from "@/utils/importer";
import { showError, showSuccess } from "@/utils/toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useQueryClient } from "@tanstack/react-query";

interface ImportDialogProps {
  trigger: React.ReactNode;
}

const ImportDialog = ({ trigger }: ImportDialogProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [importResult, setImportResult] = useState<{ successCount: number, errorCount: number, totalCount: number } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [open, setOpen] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setFile(event.target.files[0]);
      setImportResult(null);
    }
  };

  const handleImport = () => {
    if (!file || !user) {
      showError("Selecione um arquivo CSV e certifique-se de estar logado.");
      return;
    }

    setIsLoading(true);
    setIsProcessing(true);
    setImportResult(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false,
      // Adicionado para pular as duas primeiras linhas de cabeçalho irrelevantes
      skipFirstLines: 2, 
      complete: async (results) => {
        // Filter lines that have Descricao and either Pagamentos or Valor
        const rawEntries = (results.data as RawCostEntry[]).filter(e => 
          e.Descricao && (e.Pagamentos || e.Valor)
        );
        const totalCount = rawEntries.length;

        if (totalCount === 0) {
          showError("O arquivo CSV está vazio ou não contém lançamentos válidos nas colunas esperadas (Data, Descricao, Valor/Pagamentos).");
          setIsLoading(false);
          setIsProcessing(false);
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
          setIsProcessing(false);
          setFile(null);
        }
      },
      error: (error) => {
        showError(`Erro ao processar o arquivo: ${error.message}`);
        setIsLoading(false);
        setIsProcessing(false);
      }
    });
  };

  const isButtonDisabled = !file || isLoading || isProcessing;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Importação de Dados Financeiros</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <Alert variant="default">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Formato Necessário (CSV)</AlertTitle>
            <AlertDescription>
              O arquivo deve conter as colunas exatas (case-sensitive): 
              <code className="block mt-2 p-2 bg-secondary rounded text-sm">Data, Descrição, Valor</code> ou <code className="block mt-2 p-2 bg-secondary rounded text-sm">Data, Descrição, Pagamentos</code>.
              <p className="mt-2">Todos os lançamentos serão atribuídos à obra padrão: **Golden BTS**.</p>
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <label htmlFor="csv-upload" className="block text-sm font-medium">Selecione o Arquivo CSV</label>
            <Input 
              id="csv-upload"
              type="file" 
              accept=".csv" 
              onChange={handleFileChange} 
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
                <Upload className="mr-2 h-4 w-4" />
                Importar Lançamentos
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ImportDialog;