import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileUp, Loader2, AlertTriangle, CheckCircle, Clipboard } from "lucide-react";
import { useState } from "react";
import Papa from 'papaparse';
import { useAuth } from "@/integrations/supabase/auth-provider";
import { importCargos, RawCargoEntry } from "@/utils/cargo-importer";
import { showError, showSuccess } from "@/utils/toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useQueryClient } from "@tanstack/react-query";
import { Textarea } from "@/components/ui/textarea";

interface CargoImportDialogProps {
  trigger: React.ReactNode;
}

const CargoImportDialog = ({ trigger }: CargoImportDialogProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [content, setContent] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [importResult, setImportResult] = useState<{ successCount: number, errorCount: number, totalCount: number } | null>(null);
  const [open, setOpen] = useState(false);

  const processData = async (csvText: string) => {
    if (!csvText.trim() || !user) {
      showError("Nenhum dado para processar.");
      return;
    }

    setIsLoading(true);
    setImportResult(null);
    
    // Detectar delimitador de forma mais inteligente
    let delimiter = "";
    if (csvText.includes('\t')) delimiter = '\t';
    else if (csvText.includes(';')) delimiter = ';';
    else if (csvText.includes(',')) delimiter = ',';

    Papa.parse(csvText, {
      delimiter: delimiter,
      header: true,
      skipEmptyLines: 'greedy',
      transformHeader: (header) => header.trim(), // Remove espaços extras dos nomes das colunas
      complete: async (results) => {
        try {
          const rawEntries = (results.data as any[]).map(row => ({
            Nome: row.Nome || row.nome || row.Cargo || row.cargo || '',
            Custo: row.Custo || row.custo || row.Valor || row.valor || row.Salario || row.salario || '',
            Tipo: row.Tipo || row.tipo || 'Próprio'
          })).filter(e => e.Nome && e.Custo);

          if (rawEntries.length === 0) {
            showError("Nenhum cargo válido identificado. Verifique os nomes das colunas (Nome, Custo).");
            setIsLoading(false);
            return;
          }

          const result = await importCargos(rawEntries, user.id);
          setImportResult({ 
            successCount: result.successCount, 
            errorCount: result.errorCount, 
            totalCount: rawEntries.length 
          });
          
          if (result.successCount > 0) {
            showSuccess(`${result.successCount} cargos importados com sucesso.`);
            queryClient.invalidateQueries({ queryKey: ['cargos'] });
          } else {
            showError("Nenhum registro pôde ser salvo. Verifique o formato.");
          }
        } catch (error) {
          console.error("[ImportDialog] Erro:", error);
          showError(`Erro: ${error instanceof Error ? error.message : "Erro desconhecido"}`);
        } finally {
          setIsLoading(false);
        }
      },
      error: (error) => {
        showError(`Erro no processamento do texto: ${error.message}`);
        setIsLoading(false);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Importar Cargos e Salários</DialogTitle>
          <DialogDescription>Cole seus dados do Excel ou arquivo CSV.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Alert variant="default" className="bg-primary/5 border-primary/20">
            <AlertTriangle className="h-4 w-4 text-primary" />
            <AlertTitle>Formato Esperado</AlertTitle>
            <AlertDescription className="text-xs">
              O cabeçalho deve conter: <code className="bg-muted px-1">Nome</code> e <code className="bg-muted px-1">Custo</code>.<br/>
              Ex: Mestre de Obras; 350,00
            </AlertDescription>
          </Alert>

          <Textarea 
            placeholder="Nome;Custo;Tipo&#10;Pedreiro;150,00;Próprio&#10;Servente;100,00;Próprio"
            rows={8}
            value={content}
            onChange={(e) => {
                setContent(e.target.value);
                setImportResult(null);
            }}
            className="font-mono text-xs"
          />

          {importResult && (
            <Alert className={importResult.successCount > 0 ? "border-green-500" : "border-destructive"}>
              <AlertTitle className="flex items-center text-sm font-bold">
                {importResult.successCount > 0 ? <CheckCircle className="h-4 w-4 mr-2 text-green-500" /> : <AlertTriangle className="h-4 w-4 mr-2 text-destructive" />}
                Relatório de Importação
              </AlertTitle>
              <AlertDescription className="text-xs">
                Processados: {importResult.totalCount} | Sucesso: {importResult.successCount} | Falhas: {importResult.errorCount}
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={() => setOpen(false)}>Fechar</Button>
          <Button onClick={() => processData(content)} disabled={isLoading || !content.trim()}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Clipboard className="mr-2 h-4 w-4" />}
            {isLoading ? "Processando..." : "Importar Agora"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CargoImportDialog;