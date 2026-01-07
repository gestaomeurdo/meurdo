import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileUp, Loader2, AlertTriangle, CheckCircle, Clipboard, FileType } from "lucide-react";
import { useState } from "react";
import Papa from 'papaparse';
import { useAuth } from "@/integrations/supabase/auth-provider";
import { importCargos, RawCargoEntry } from "@/utils/cargo-importer";
import { showError, showSuccess } from "@/utils/toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useQueryClient } from "@tanstack/react-query";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CargoImportDialogProps {
  trigger: React.ReactNode;
}

const CargoImportDialog = ({ trigger }: CargoImportDialogProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [content, setContent] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [importResult, setImportResult] = useState<{ successCount: number, errorCount: number, totalCount: number } | null>(null);
  const [open, setOpen] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setContent(""); // Limpa o texto se selecionou arquivo
      setImportResult(null);
    }
  };

  const processImport = async () => {
    if (!file && !content.trim()) {
      showError("Selecione um arquivo ou cole os dados.");
      return;
    }

    if (!user) return;

    setIsLoading(true);
    setImportResult(null);

    const parseConfig = {
      header: true,
      skipEmptyLines: 'greedy',
      transformHeader: (header: string) => header.trim(),
      complete: async (results: any) => {
        try {
          const rawEntries = (results.data as any[]).map(row => ({
            Nome: row.Nome || row.nome || row.Cargo || row.cargo || '',
            Custo: row.Custo || row.custo || row.Valor || row.valor || row.Salario || row.salario || '',
            Tipo: row.Tipo || row.tipo || 'Próprio'
          })).filter(e => e.Nome && e.Custo);

          if (rawEntries.length === 0) {
            showError("Nenhum cargo válido encontrado. Verifique se o cabeçalho tem 'Nome' e 'Custo'.");
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
            showError("Não foi possível salvar os registros. Verifique o arquivo.");
          }
        } catch (error) {
          showError(`Erro: ${error instanceof Error ? error.message : "Erro desconhecido"}`);
        } finally {
          setIsLoading(false);
        }
      },
      error: (error: any) => {
        showError(`Erro no processamento: ${error.message}`);
        setIsLoading(false);
      }
    };

    if (file) {
      Papa.parse(file, parseConfig);
    } else {
      Papa.parse(content, parseConfig);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Importar Cargos e Salários</DialogTitle>
          <DialogDescription>Selecione um arquivo CSV/Excel ou cole os dados abaixo.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="cargo-file">Upload de Arquivo (CSV ou TXT)</Label>
            <div className="flex gap-2">
                <Input 
                    id="cargo-file"
                    type="file" 
                    accept=".csv,.txt" 
                    onChange={handleFileChange}
                    className="flex-1"
                />
                {file && (
                    <Button variant="outline" size="icon" onClick={() => setFile(null)} title="Remover arquivo">
                        <AlertTriangle className="h-4 w-4 text-destructive" />
                    </Button>
                )}
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Ou cole os dados</span>
            </div>
          </div>

          <Textarea 
            placeholder="Nome;Custo;Tipo&#10;Pedreiro;150,00;Próprio"
            rows={5}
            value={content}
            onChange={(e) => {
                setContent(e.target.value);
                setFile(null); // Limpa o arquivo se colou texto
                setImportResult(null);
            }}
            className="font-mono text-xs"
          />

          {importResult && (
            <Alert className={importResult.successCount > 0 ? "border-green-500" : "border-destructive"}>
              <AlertTitle className="flex items-center text-sm font-bold">
                {importResult.successCount > 0 ? <CheckCircle className="h-4 w-4 mr-2 text-green-500" /> : <AlertTriangle className="h-4 w-4 mr-2 text-destructive" />}
                Resultado
              </AlertTitle>
              <AlertDescription className="text-xs">
                Linhas: {importResult.totalCount} | Sucesso: {importResult.successCount} | Falhas: {importResult.errorCount}
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={() => setOpen(false)}>Fechar</Button>
          <Button onClick={processImport} disabled={isLoading || (!file && !content.trim())}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileUp className="mr-2 h-4 w-4" />}
            {isLoading ? "Processando..." : "Importar Agora"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CargoImportDialog;