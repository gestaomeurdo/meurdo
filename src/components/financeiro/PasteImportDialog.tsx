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
}

// Função auxiliar para normalizar texto (remove acentos, espaços extras, lowercase)
const normalizeText = (text: string | undefined) => {
  if (!text) return "";
  return text.toString().trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") || "";
};

const PasteImportDialog = ({ trigger }: PasteImportDialogProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [csvContent, setCsvContent] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [importResult, setImportResult] = useState<{ successCount: number, errorCount: number, totalCount: number } | null>(null);
  const [open, setOpen] = useState(false);

  const handleImport = () => {
    if (!csvContent.trim() || !user) {
      showError("Cole o conteúdo do CSV na caixa de texto e certifique-se de estar logado.");
      return;
    }

    setIsLoading(true);
    setImportResult(null);

    // Tenta detectar o delimitador. Se o conteúdo for colado do Excel, é provável que seja tab (\t).
    // Usamos a tabulação como delimitador padrão para colagem de planilhas.
    const delimiter = csvContent.includes('\t') ? '\t' : ''; 

    Papa.parse(csvContent, {
      delimiter: delimiter, 
      header: false, 
      skipEmptyLines: true,
      complete: async (results) => {
        console.log("[ImportDialog] PapaParse Complete. Results:", results);
        
        const rows = results.data as string[][];
        
        if (rows.length === 0) {
          showError("Nenhum dado encontrado no conteúdo colado.");
          setIsLoading(false);
          return;
        }

        // 1. Encontrar a linha de cabeçalho e mapear colunas
        let headerRowIndex = -1;
        let colMap = { date: -1, desc: -1, amount: -1 };

        for (let i = 0; i < Math.min(rows.length, 10); i++) {
          const row = rows[i].map(normalizeText);
          
          const dateIdx = row.findIndex(c => c.includes('data'));
          const descIdx = row.findIndex(c => c.includes('descricao') || c.includes('historico'));
          const amountIdx = row.findIndex(c => c.includes('valor') || c.includes('pagamento') || c.includes('saida'));

          // Requer Data E (Descrição OU Valor/Pagamentos)
          if (dateIdx !== -1 && (descIdx !== -1 || amountIdx !== -1)) {
            headerRowIndex = i;
            colMap = { date: dateIdx, desc: descIdx, amount: amountIdx };
            console.log(`[ImportDialog] Header found at row ${i}. Map:`, colMap);
            break;
          }
        }

        if (headerRowIndex === -1) {
          showError("Não foi possível identificar as colunas (Data, Descrição, Valor/Pagamentos). Verifique se copiou o cabeçalho.");
          setIsLoading(false);
          return;
        }

        // 2. Extrair e mapear os dados para o formato RawCostEntry
        const rawEntries: RawCostEntry[] = [];
        
        for (let i = headerRowIndex + 1; i < rows.length; i++) {
          const row = rows[i];
          
          const rawDate = row[colMap.date];
          const rawDesc = row[colMap.desc];
          const rawAmount = row[colMap.amount];

          // Validação básica: precisa ter Data e pelo menos um valor
          if (rawDate && (rawAmount || rawDesc)) {
            rawEntries.push({
              Data: rawDate,
              Descricao: rawDesc || 'Sem descrição',
              Pagamentos: rawAmount, 
              Valor: rawAmount, 
            });
          }
        }
        
        const totalCount = rawEntries.length;
        console.log(`[ImportDialog] Total raw entries extracted: ${totalCount}`);


        if (totalCount === 0) {
          showError("Nenhuma transação válida encontrada após o processamento do cabeçalho.");
          setIsLoading(false);
          return;
        }

        // 3. Inserir no Supabase
        try {
          const { successCount, errorCount } = await importFinancialEntries(rawEntries, user.id);
          
          setImportResult({ successCount, errorCount, totalCount });
          showSuccess(`Importação concluída! ${successCount} lançamentos adicionados.`);
          
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
        console.error(`[ImportDialog] Erro ao processar o conteúdo: ${error.message}`);
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
              <p>1. Copie as colunas de dados, **incluindo o cabeçalho** (Ex: Data, Descrição, Valor).</p>
              <p>2. O sistema tentará **detectar automaticamente** o separador e as colunas.</p>
              <p className="mt-2">Todos os lançamentos serão atribuídos à obra padrão: **Golden BTS**.</p>
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="csv-paste" className="block text-sm font-medium">Cole o conteúdo do Excel/CSV aqui:</Label>
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