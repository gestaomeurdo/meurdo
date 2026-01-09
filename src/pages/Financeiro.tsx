import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useObras, Obra } from "@/hooks/use-obras";
import { useState, useMemo, useEffect } from "react";
import { Loader2, Plus, Clipboard, FileUp, AlertTriangle, Settings, Trash2, ArrowLeft, LayoutGrid } from "lucide-react";
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
import ObraCardSelection from "@/components/financeiro/ObraCardSelection";

const Financeiro = () => {
  const { data: obras, isLoading: isLoadingObras } = useObras();
  const [selectedObraId, setSelectedObraId] = useState<string | undefined>(undefined);
  const [filters, setFilters] = useState({});
  const deleteAllMutation = useDeleteAllFinancialEntries();

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

  // Visualização Inicial: Seleção de Obra
  if (!selectedObraId) {
    return (
      <DashboardLayout>
        <div className="p-6 space-y-8 animate-in fade-in duration-500">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-bold">Controle Financeiro</h1>
            <p className="text-muted-foreground text-lg">Selecione uma obra para gerenciar os lançamentos e custos.</p>
          </div>

          {!obras || obras.length === 0 ? (
            <Card className="border-dashed py-20 text-center">
              <CardContent>
                <AlertTriangle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Você ainda não possui obras cadastradas.</p>
                <Button variant="link" onClick={() => window.location.href='/obras'} className="mt-2">Cadastrar Obras</Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {obras.map(obra => (
                <ObraCardSelection 
                  key={obra.id} 
                  obra={obra} 
                  onClick={setSelectedObraId} 
                />
              ))}
            </div>
          )}
        </div>
      </DashboardLayout>
    );
  }

  // Visualização Detalhada
  return (
    <DashboardLayout>
      <div className="p-6 space-y-6 animate-in slide-in-from-bottom-2 duration-300">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => setSelectedObraId(undefined)} title="Voltar à seleção">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold truncate max-w-md">{selectedObra?.nome}</h1>
              <p className="text-muted-foreground">Controle financeiro detalhado</p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <CategoryManagementDialog trigger={<Button variant="outline" size="sm"><Settings className="w-4 h-4 mr-2" /> Categorias</Button>} />
            <PasteImportDialog selectedObraId={selectedObraId} selectedObraNome={selectedObra?.nome} trigger={<Button variant="outline" size="sm"><Clipboard className="w-4 h-4 mr-2" /> Colar CSV</Button>} />
            <ImportDialog selectedObraId={selectedObraId} selectedObraNome={selectedObra?.nome} trigger={<Button variant="outline" size="sm"><FileUp className="w-4 h-4 mr-2" /> Importar Arquivo</Button>} />
          </div>
        </div>

        {entriesError ? (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Erro ao carregar lançamentos</AlertTitle>
            <AlertDescription>{entriesError.message}</AlertDescription>
          </Alert>
        ) : (
          <>
            <div className="flex justify-between items-center">
                <Button variant="ghost" size="sm" onClick={() => setSelectedObraId(undefined)} className="text-primary">
                    <LayoutGrid className="w-4 h-4 mr-2" /> Trocar Obra
                </Button>
                {entries && entries.length > 0 && (
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10">
                                <Trash2 className="w-4 h-4 mr-2" /> Limpar Tudo
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Apagar todos os lançamentos?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Isso removerá permanentemente TODOS os {entries?.length} lançamentos desta obra.
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
            
            <FinancialSummary obra={selectedObra!} entriesResult={entriesResult} isLoading={isLoadingEntries} />
            {(entries && entries.length > 0 || isLoadingEntries) && <ExpenseCharts entriesResult={entriesResult} isLoading={isLoadingEntries} />}
            
            <Card className="border-t-4 border-t-primary shadow-lg">
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
        )}
      </div>
      
      <div className="fixed bottom-6 right-6 z-10">
        <EntryDialog obraId={selectedObraId} trigger={<Button size="lg" className="rounded-full shadow-2xl h-14 w-14 p-0"><Plus className="w-8 h-8" /></Button>} />
      </div>
    </DashboardLayout>
  );
};

export default Financeiro;