import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, AlertTriangle, CheckCircle, Clipboard } from "lucide-react";
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
  selectedObraId?: string;
  selectedObraNome?: string;
}

const normalizeText = (text: string | undefined) => {
  if (!text) return "";
  return text.toString().trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") || "";
};

const PasteImportDialog = ({ trigger, selectedObraId, selectedObraNome }: PasteImportDialogProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [csvContent, setCsvContent] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [importResult, setImportResult] = useState<{ successCount: number, errorCount: number, totalCount: number } | null>(null);
  const [open, setOpen] = useState(false);

  const handleImport = async () => {
    if (!csvContent.trim() || !user) {
      showError("Cole o conteúdo do CSV e verifique sua conexão.");
      return;
    }

    if (!selectedObraId) {
      showError("Selecione uma obra antes de importar.");
      return;
    }

    setIsLoading(true);
    setImportResult(null);

    // Detectar delimitador (tab para excel, vírgula ou ponto-e-vírgula)
    let delimiter = "";
    if (csvContent.includes('\t')) delimiter = '\t';
    else if (csvContent.includes(';')) delimiter = ';';
    else if (csvContent.includes(',')) delimiter = ',';

    Papa.parse(csvContent, {
      delimiter: delimiter,
      header: false,
      skipEmptyLines: true,
      complete: async (results) => {
        const rows = results.data as string[][];
        if (rows.length === 0) {
          showError("Nenhum dado encontrado.");
          setIsLoading(false);
          return;
        }

        let headerRowIndex = -1;
        let colMap = { date: -1, desc: -1, amount: -1 };

        for (let i = 0; i < Math.min(rows.length, 5); i++) {
          const row = rows[i].map(normalizeText);
          const dateIdx = row.findIndex(c => c.includes('data'));
          const descIdx = row.findIndex(c => c.includes('descricao') || c.includes('historico'));
          const amountIdx = row.findIndex(c => c.includes('valor') || c.includes('pagamento') || c.includes('saida'));

          if (dateIdx !== -1 && (descIdx !== -1 || amountIdx !== -1)) {
            headerRowIndex = i;
            colMap = { date: dateIdx, desc: descIdx, amount: amountIdx };
            break;
          }
        }

        if (headerRowIndex === -1) {
          showError("Cabeçalho não identificado. Copie as colunas 'Data', 'Descrição' e 'Valor'.");
          setIsLoading(false);
          return;
        }

        const rawEntries: RawCostEntry[] = [];
        for (let i = headerRowIndex + 1; i < rows.length; i++) {
          const row = rows[i];
          if (row[colMap.date]) {
            rawEntries.push({
              Data: row[colMap.date],
              Descricao: row[colMap.desc] || 'Sem descrição',
              Valor: row[colMap.amount],
            });
          }
        }

        if (rawEntries.length === 0) {
          showError("Nenhuma transação válida encontrada.");
          setIsLoading(false);
          return;
        }

        try {
          const result = await importFinancialEntries(rawEntries, user.id, selectedObraId);
          setImportResult({ 
            successCount: result.successCount, 
            errorCount: result.errorCount, 
            totalCount: rawEntries.length 
          });
          showSuccess(`${result.successCount} lançamentos importados com sucesso.`);
          
          queryClient.invalidateQueries({ queryKey: ['financialEntries'] });
          queryClient.invalidateQueries({ queryKey: ['dashboardData'] });
        } catch (error) {
          showError(`Erro: ${error instanceof Error ? error.message : "Erro desconhecido"}`);
        } finally {
          setIsLoading(false);
        }
      },
      error: (error) => {
        showError(`Erro no processamento: ${error.message}`);
        setIsLoading(false);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Importar para: {selectedObraNome || "Selecione uma Obra"}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <Alert variant="default">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Importante</AlertTitle>
            <AlertDescription>
              Os dados serão inseridos na obra **{selectedObraNome}**. 
              Copie do Excel incluindo a linha de cabeçalho (Data, Descrição, Valor).
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="csv-paste">Cole os dados aqui:</Label>
            <Textarea 
              id="csv-paste"
              rows={8}
              placeholder="Data;Descrição;Valor..."
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
                Resultado
              </AlertTitle>
              <AlertDescription>
                Processados: {importResult.totalCount} | Sucesso: {importResult.successCount} | Falhas: {importResult.errorCount}
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={() => setOpen(false)}>Fechar</Button>
          <Button onClick={handleImport} disabled={isLoading || !csvContent}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Clipboard className="mr-2 h-4 w-4" />}
            {isLoading ? "Importando..." : "Processar e Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PasteImportDialog;