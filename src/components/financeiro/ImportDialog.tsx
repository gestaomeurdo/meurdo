import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileUp, Loader2, AlertTriangle, CheckCircle } from "lucide-react";
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
  selectedObraId?: string;
  selectedObraNome?: string;
}

const ImportDialog = ({ trigger, selectedObraId, selectedObraNome }: ImportDialogProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [importResult, setImportResult] = useState<{ successCount: number, errorCount: number, totalCount: number } | null>(null);
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

    if (!selectedObraId) {
      showError("Selecione uma obra antes de importar.");
      return;
    }

    setIsLoading(true);
    setImportResult(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: 'greedy',
      dynamicTyping: false,
      // Forçamos a detecção de delimitadores comuns como ; ou ,
      complete: async (results) => {
        // Mapeamento flexível para aceitar "Descrição", "Descricao", "Valor", "Pagamentos", etc.
        const rawEntries = (results.data as any[]).map(row => {
            return {
                Data: row.Data || row.data || row.DATA || '',
                Descricao: row.Descrição || row.Descricao || row.descricao || row.HISTORICO || row.Historico || '',
                Valor: row.Valor || row.valor || row.VALOR || row.Pagamentos || row.pagamentos || row.Saída || row.saida || ''
            } as RawCostEntry;
        }).filter(e => e.Data && (e.Descricao || e.Valor));

        const totalCount = rawEntries.length;

        if (totalCount === 0) {
          showError("Nenhum dado válido encontrado. Verifique se o cabeçalho é: Data;Descrição;Valor");
          setIsLoading(false);
          return;
        }

        try {
          const result = await importFinancialEntries(rawEntries, user.id, selectedObraId);
          
          setImportResult({ 
            successCount: result.successCount, 
            errorCount: result.errorCount, 
            totalCount: totalCount 
          });
          
          showSuccess(`Importação concluída! ${result.successCount} lançamentos adicionados.`);
          
          queryClient.invalidateQueries({ queryKey: ['financialEntries'] });
          queryClient.invalidateQueries({ queryKey: ['dashboardData'] });

        } catch (error) {
          console.error("Erro na importação:", error);
          showError(`Falha na importação: ${error instanceof Error ? error.message : "Erro desconhecido"}`);
        } finally {
          setIsLoading(false);
          setFile(null);
        }
      },
      error: (error) => {
        showError(`Erro ao processar o arquivo: ${error.message}`);
        setIsLoading(false);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Importar Arquivo para: {selectedObraNome || "Selecione uma Obra"}</DialogTitle>
          <DialogDescription>
            Envie seu arquivo CSV (Bloco de Notas ou Excel).
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <Alert variant="default">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Padrão do Arquivo</AlertTitle>
            <AlertDescription>
              Use ponto e vírgula (;) para separar as colunas.<br />
              Exemplo: <code className="text-xs bg-muted p-1">Data;Descrição;Valor</code>
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <label htmlFor="csv-file" className="block text-sm font-medium">Arquivo .csv ou .txt</label>
            <Input 
              id="csv-file"
              type="file" 
              accept=".csv,.txt" 
              onChange={handleFileChange} 
              disabled={isLoading}
            />
          </div>

          {importResult && (
            <Alert className={importResult.successCount > 0 ? "border-green-500" : "border-destructive"}>
              <AlertTitle className="flex items-center">
                {importResult.successCount > 0 ? <CheckCircle className="h-4 w-4 mr-2 text-green-500" /> : <AlertTriangle className="h-4 w-4 mr-2 text-destructive" />}
                Relatório
              </AlertTitle>
              <AlertDescription>
                Processados: {importResult.totalCount} | Sucesso: {importResult.successCount} | Falhas: {importResult.errorCount}
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button 
            onClick={handleImport} 
            disabled={!file || isLoading}
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FileUp className="mr-2 h-4 w-4" />
            )}
            {isLoading ? "Importando..." : "Carregar Dados"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ImportDialog;