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

    // Usamos PapaParse com detecção automática de delimitadores (priorizando ; e ,)
    Papa.parse(file, {
      header: true,
      skipEmptyLines: 'greedy',
      dynamicTyping: false,
      delimitersToGuess: [';', ',', '\t'],
      complete: async (results) => {
        console.log("[ImportDialog] PapaParse completado. Linhas detectadas:", results.data.length);
        
        if (results.errors.length > 0) {
            console.warn("[ImportDialog] Erros de parsing:", results.errors);
        }

        // Mapeamento flexível para aceitar variações de nomes de colunas
        const rawEntries = (results.data as any[]).map(row => {
            return {
                Data: row.Data || row.data || row.DATA || '',
                Descricao: row.Descrição || row.Descricao || row.descricao || row.HISTORICO || row.Historico || '',
                Valor: row.Valor || row.valor || row.VALOR || row.Pagamentos || row.pagamentos || row.Saída || row.saida || ''
            } as RawCostEntry;
        }).filter(e => {
            const hasData = e.Data && e.Data.toString().trim().length > 0;
            const hasValue = e.Valor && e.Valor.toString().trim().length > 0;
            return hasData && hasValue;
        });

        const totalCount = rawEntries.length;

        if (totalCount === 0) {
          showError("Nenhum dado válido encontrado. O arquivo deve ter as colunas: Data, Descrição e Valor.");
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
          
          if (result.successCount > 0) {
            showSuccess(`Importação concluída! ${result.successCount} lançamentos adicionados.`);
            queryClient.invalidateQueries({ queryKey: ['financialEntries'] });
            queryClient.invalidateQueries({ queryKey: ['dashboardData'] });
          } else {
            showError("Nenhum lançamento novo foi inserido. Verifique o formato dos dados.");
          }

        } catch (error) {
          console.error("Erro na importação:", error);
          showError(`Falha na importação: ${error instanceof Error ? error.message : "Erro desconhecido"}`);
        } finally {
          setIsLoading(false);
          setFile(null);
        }
      },
      error: (error) => {
        console.error("[ImportDialog] Erro do PapaParse:", error);
        showError(`Erro ao ler o arquivo: ${error.message}`);
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
            Envie seu arquivo CSV (Excel ou Bloco de Notas). O separador pode ser ponto e vírgula (;) ou vírgula (,).
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <Alert variant="default" className="bg-primary/5 border-primary/20">
            <AlertTriangle className="h-4 w-4 text-primary" />
            <AlertTitle className="text-primary">Dica de Formato</AlertTitle>
            <AlertDescription className="text-xs">
              O arquivo deve ter um cabeçalho simples. Exemplo:<br />
              <code className="bg-muted p-1 rounded">Data;Descrição;Valor</code><br />
              <code className="bg-muted p-1 rounded">25/03/2024;Compra de Cimento;1500,00</code>
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <label htmlFor="csv-file" className="block text-sm font-medium">Selecionar Arquivo (.csv ou .txt)</label>
            <Input 
              id="csv-file"
              type="file" 
              accept=".csv,.txt" 
              onChange={handleFileChange} 
              disabled={isLoading}
              className="cursor-pointer"
            />
          </div>

          {importResult && (
            <Alert className={importResult.successCount > 0 ? "border-green-500 bg-green-50/10" : "border-destructive bg-destructive/5"}>
              <AlertTitle className="flex items-center text-sm font-bold">
                {importResult.successCount > 0 ? <CheckCircle className="h-4 w-4 mr-2 text-green-500" /> : <AlertTriangle className="h-4 w-4 mr-2 text-destructive" />}
                Resultado do Processamento
              </AlertTitle>
              <AlertDescription className="text-xs">
                Total lido: {importResult.totalCount} | Sucesso: {importResult.successCount} | Ignorados/Erros: {importResult.errorCount}
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>Cancelar</Button>
          <Button 
            onClick={handleImport} 
            disabled={!file || isLoading}
            className="min-w-[140px]"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Importando...
              </>
            ) : (
              <>
                <FileUp className="mr-2 h-4 w-4" />
                Carregar Dados
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ImportDialog;