import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Upload, Loader2, AlertTriangle, CheckCircle } from "lucide-react";
import { useState } from "react";
import Papa from 'papaparse';
import { useAuth } from "@/integrations/supabase/auth-provider";
import { importFinancialEntries, RawCostEntry } from "@/utils/importer";
import { showError, showSuccess } from "@/utils/toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useQueryClient } from "@tanstack/react-query";

const Import = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [importResult, setImportResult] = useState<{ successCount: number, errorCount: number, totalCount: number } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

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
      dynamicTyping: false, // Manter valores como strings para análise de moeda
      complete: async (results) => {
        // Filtra linhas que parecem ser lançamentos de despesa (têm Descricao e Pagamentos)
        const rawEntries = (results.data as RawCostEntry[]).filter(e => e.Descricao && e.Pagamentos);
        const totalCount = rawEntries.length;

        if (totalCount === 0) {
          showError("O arquivo CSV está vazio ou não contém lançamentos válidos nas colunas esperadas (Data, Descricao, Pagamentos).");
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
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <h1 className="text-3xl font-bold mb-2">Importação de Dados Financeiros</h1>
        <p className="text-muted-foreground">
          Importe lançamentos financeiros em massa a partir de um arquivo CSV.
        </p>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Instruções de Importação</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="default">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Formato Necessário (CSV)</AlertTitle>
              <AlertDescription>
                Converta sua planilha Excel para o formato CSV. O arquivo deve conter as colunas exatas (case-sensitive) para as despesas: 
                <code className="block mt-2 p-2 bg-secondary rounded text-sm">Data, Descrição, Pagamentos</code>.
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

            <Button 
              onClick={handleImport} 
              disabled={isButtonDisabled}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processando {file?.name}...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Importar Lançamentos
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {importResult && (
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Resultado da Importação</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p>Total de linhas processadas: <span className="font-bold">{importResult.totalCount}</span></p>
              <p className="flex items-center text-green-500">
                <CheckCircle className="h-4 w-4 mr-2" />
                Lançamentos importados com sucesso: <span className="font-bold ml-1">{importResult.successCount}</span>
              </p>
              {importResult.errorCount > 0 && (
                <p className="flex items-center text-destructive">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Linhas com erro (ignoradas ou duplicadas): <span className="font-bold ml-1">{importResult.errorCount}</span>
                </p>
              )}
              <Alert className="mt-4">
                <AlertDescription>
                    Os lançamentos foram categorizados automaticamente por palavras-chave. Revise a página Financeiro para verificar e reclassificar se necessário.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Import;