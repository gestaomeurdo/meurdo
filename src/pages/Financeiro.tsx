import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useObras, Obra } from "@/hooks/use-obras";
import { useState, useMemo, useEffect } from "react";
import { Loader2, Plus, Clipboard, FileUp, Filter, AlertTriangle, Settings, RotateCcw, Trash2 } from "lucide-react";
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

const Financeiro = () => {
  const { data: obras, isLoading: isLoadingObras } = useObras();
  const [selectedObraId, setSelectedObraId] = useState<string | undefined>(undefined);
  const [filters, setFilters] = useState({});
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

  const handleClearFilters = () => {
    setFilters({});
    refetch();
  };

  if (isLoadingObras) {
    return (
      <DashboardLayout>
        <div className="p-6 flex justify-center items-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Carregando dados iniciais...</span>
        </div>
      </DashboardLayout>
    );
  }

  const hasEntries = entries && entries.length > 0;
  const isFiltered = Object.keys(filters).length > 0;

  const renderContent = () => {
    if (!selectedObra) {
      return (
        <div className="text-center py-12 border border-dashed rounded-lg bg-muted/50">
          <p className="text-muted-foreground">Selecione uma obra para visualizar o financeiro.</p>
        </div>
      );
    }
    
    if (entriesError) {
      return (
        <Alert variant="destructive" className="mt-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Erro ao carregar lançamentos</AlertTitle>
          <AlertDescription>{entriesError.message}</AlertDescription>
        </Alert>
      );
    }

    return (
      <>
        <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-primary truncate">Obra: {selectedObra.nome}</h2>
            {hasEntries && (
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10">
                            <Trash2 className="w-4 h-4 mr-2" /> Limpar Financeiro
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Apagar todos os lançamentos?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Isso removerá permanentemente TODOS os {entries?.length} lançamentos financeiros desta obra. Use isso apenas se quiser reiniciar o controle financeiro para importar novamente do zero.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={handleClearAll} className="bg-destructive hover:bg-destructive/90">
                                Sim, Apagar Tudo
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            )}
        </div>
        
        <FinancialSummary obra={selectedObra} entriesResult={entriesResult} isLoading={isLoadingEntries} />
        {(hasEntries || isLoadingEntries) && <ExpenseCharts entriesResult={entriesResult} isLoading={isLoadingEntries} />}
        
        <Card>
            <CardHeader><CardTitle className="text-xl">Lançamentos de Despesas</CardTitle></CardHeader>
            <CardContent>
              <EntriesTable 
                entriesResult={entriesResult} 
                obraId={selectedObraId!} 
                isLoading={isLoadingEntries} 
                refetch={refetch}
                setFilters={setFilters}
                currentFilters={filters}
              />
            </CardContent>
        </Card>
      </>
    );
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
          <h1 className="text-3xl font-bold">Controle Financeiro</h1>
          <div className="flex flex-wrap gap-3 items-center">
            <ObraSelector selectedObraId={selectedObraId} onSelectObra={setSelectedObraId} />
            <div className="flex gap-2">
              <CategoryManagementDialog trigger={<Button variant="outline"><Settings className="w-4 h-4 mr-2" /> Categorias</Button>} />
              <PasteImportDialog selectedObraId={selectedObraId} selectedObraNome={selectedObra?.nome} trigger={<Button variant="outline"><Clipboard className="w-4 h-4 mr-2" /> Colar CSV</Button>} />
              <ImportDialog selectedObraId={selectedObraId} selectedObraNome={selectedObra?.nome} trigger={<Button variant="outline"><FileUp className="w-4 h-4 mr-2" /> Importar Arquivo</Button>} />
            </div>
          </div>
        </div>
        {renderContent()}
      </div>
      {selectedObraId && (
        <div className="fixed bottom-6 right-6 z-10">
          <EntryDialog obraId={selectedObraId} trigger={<Button size="lg" className="rounded-full shadow-lg"><Plus className="w-6 h-6" /></Button>} />
        </div>
      )}
    </DashboardLayout>
  );
};

export default Financeiro;