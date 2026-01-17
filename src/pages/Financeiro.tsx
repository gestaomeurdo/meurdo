import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useObras, Obra } from "@/hooks/use-obras";
import { useState, useMemo, useEffect } from "react";
import { Loader2, Plus, Clipboard, FileUp, AlertTriangle, Settings, Trash2 } from "lucide-react";
import ObraSelector from "@/components/financeiro/ObraSelector";
import FinancialSummary from "@/components/financeiro/FinancialSummary";
import EntriesTable from "@/components/financeiro/EntriesTable";
import EntryDialog from "@/components/financeiro/EntryDialog";
import { useFinancialEntries, useDeleteAllFinancialEntries } from "@/hooks/use-financial-entries";
import ExpenseCharts from "@/components/financeiro/ExpenseCharts";
import { Button } from "@/components/ui/button";
import PasteImportDialog from "@/components/financeiro/PasteImportDialog";
import ImportDialog from "@/components/financeiro/ImportDialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import CategoryManagementDialog from "@/components/financeiro/CategoryManagementDialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { showSuccess, showError } from "@/utils/toast";
import { useIsMobile } from "@/hooks/use-mobile";

const Financeiro = () => {
  const { data: obras, isLoading: isLoadingObras } = useObras();
  const [selectedObraId, setSelectedObraId] = useState<string | undefined>(undefined);
  const [filters, setFilters] = useState({});
  const isMobile = useIsMobile();

  const deleteAllMutation = useDeleteAllFinancialEntries();

  useEffect(() => {
    if (obras && obras.length > 0 && !selectedObraId) {
      setSelectedObraId(obras[0].id);
    }
  }, [obras, selectedObraId]);

  const selectedObra: Obra | undefined = useMemo(() => {
    return obras?.find(o => o.id === selectedObraId);
  }, [obras, selectedObraId]);

  const { data: entriesResult, isLoading: isLoadingEntries, error: entriesError, refetch } = useFinancialEntries({
    obraId: selectedObraId || '',
    ...filters,
  });

  const entries = entriesResult?.entries;

  const handleClearAll = async () => {
    if (!selectedObraId) return;
    try {
      await deleteAllMutation.mutateAsync(selectedObraId);
      showSuccess("Todos os lançamentos desta obra foram removidos.");
    } catch (err) {
      showError("Erro ao limpar lançamentos.");
    }
  };

  const renderContent = () => {
    if (isLoadingObras) {
      return (
        <div className="flex justify-center items-center h-full py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Carregando obras...</span>
        </div>
      );
    }

    if (!selectedObraId) {
      return (
        <div className="text-center py-12 border border-dashed rounded-lg bg-muted/50">
          <AlertTriangle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Nenhuma obra selecionada</h2>
          <p className="text-muted-foreground">Selecione uma obra no menu acima para gerenciar o financeiro.</p>
        </div>
      );
    }

    if (entriesError) {
      return (
        <Alert variant="destructive" className="mt-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Erro ao carregar lançamentos</AlertTitle>
          <AlertDescription>
            Não foi possível carregar os dados financeiros.
            <p className="mt-2 text-sm italic">Detalhe: {entriesError.message}</p>
          </AlertDescription>
        </Alert>
      );
    }

    return (
      <div className="space-y-6">
        <FinancialSummary
          obra={selectedObra!}
          entriesResult={entriesResult}
          isLoading={isLoadingEntries}
        />

        {/* Gráficos em coluna no mobile */}
        {(entries && entries.length > 0 || isLoadingEntries) && (
          <div className="grid grid-cols-1 gap-6">
            <ExpenseCharts entriesResult={entriesResult} isLoading={isLoadingEntries} />
          </div>
        )}

        <Card className="shadow-sm">
          <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0">
            <CardTitle className="text-xl">Lançamentos</CardTitle>
            {entries && entries.length > 0 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:bg-destructive/10 w-full sm:w-auto justify-start sm:justify-center"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Limpar Todos Lançamentos
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="w-[90vw] max-w-md rounded-xl">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Apagar tudo?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Isso removerá os {entries?.length} lançamentos desta obra definitivamente.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                    <AlertDialogCancel className="w-full sm:w-auto">Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleClearAll}
                      className="bg-destructive w-full sm:w-auto"
                    >
                      Sim, Apagar Tudo
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </CardHeader>
          <CardContent className="px-2 sm:px-6">
            <EntriesTable
              entriesResult={entriesResult}
              obraId={selectedObraId}
              isLoading={isLoadingEntries}
              refetch={refetch}
              setFilters={setFilters}
              currentFilters={filters}
            />
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 space-y-6 animate-in fade-in duration-500">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl sm:text-3xl font-bold">Financeiro</h1>
            <p className="text-sm text-muted-foreground">Gestão de custos e orçamentos.</p>
          </div>
          <div className="flex flex-col gap-4">
            <div className="w-full sm:max-w-sm">
              <ObraSelector selectedObraId={selectedObraId} onSelectObra={setSelectedObraId} />
            </div>
            <div className="flex flex-wrap gap-2">
              <CategoryManagementDialog
                trigger={
                  <Button variant="outline" size="sm" className="flex-1 sm:flex-none">
                    <Settings className="w-4 h-4 mr-2" />
                    Categorias
                  </Button>
                }
              />
              <PasteImportDialog
                selectedObraId={selectedObraId}
                selectedObraNome={selectedObra?.nome}
                trigger={
                  <Button variant="outline" size="sm" className="flex-1 sm:flex-none">
                    <Clipboard className="w-4 h-4 mr-2" />
                    Colar CSV
                  </Button>
                }
              />
              <ImportDialog
                selectedObraId={selectedObraId}
                selectedObraNome={selectedObra?.nome}
                trigger={
                  <Button variant="outline" size="sm" className="flex-1 sm:flex-none">
                    <FileUp className="w-4 h-4 mr-2" />
                    Importar
                  </Button>
                }
              />
            </div>
          </div>
        </div>
        {renderContent()}
      </div>
      {selectedObraId && (
        <div className="fixed bottom-6 right-6 z-10 sm:bottom-10 sm:right-10">
          <EntryDialog
            obraId={selectedObraId}
            trigger={
              <Button
                size="lg"
                className="rounded-full shadow-2xl h-14 w-14 p-0 bg-primary hover:bg-primary/90"
              >
                <Plus className="w-8 h-8" />
              </Button>
            }
          />
        </div>
      )}
    </DashboardLayout>
  );
};

export default Financeiro;