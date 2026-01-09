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

const Financeiro = () => {
  const { data: obras, isLoading: isLoadingObras } = useObras();
  const [selectedObraId, setSelectedObraId] = useState<string | undefined>(undefined);
  const [filters, setFilters] = useState({});
  const deleteAllMutation = useDeleteAllFinancialEntries();

  // Seleciona a primeira obra automaticamente se nenhuma estiver selecionada
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
            Não foi possível carregar os dados financeiros. Verifique sua conexão.
            <p className="mt-2 text-sm italic">Detalhe: {entriesError.message}</p>
          </AlertDescription>
        </Alert>
      );
    }

    return (
      <div className="space-y-6">
        <FinancialSummary obra={selectedObra!} entriesResult={entriesResult} isLoading={isLoadingEntries} />

        {(entries && entries.length > 0 || isLoadingEntries) && (
          <ExpenseCharts entriesResult={entriesResult} isLoading={isLoadingEntries} />
        )}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xl">Lançamentos de Despesas</CardTitle>
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
                      Esta ação removerá permanentemente TODOS os {entries?.length} lançamentos desta obra. Esta ação não pode ser desfeita.
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
          </CardHeader>
          <CardContent>
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
      <div className="p-6 space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Gestão Financeira</h1>
            <p className="text-muted-foreground">Controle de custos, notas fiscais e orçamentos.</p>
          </div>
          <div className="flex flex-wrap gap-3 items-center">
            <ObraSelector 
              selectedObraId={selectedObraId} 
              onSelectObra={setSelectedObraId} 
            />
            <div className="flex gap-2">
              <CategoryManagementDialog trigger={<Button variant="outline" size="sm"><Settings className="w-4 h-4 mr-2" /> Categorias</Button>} />
              <PasteImportDialog selectedObraId={selectedObraId} selectedObraNome={selectedObra?.nome} trigger={<Button variant="outline" size="sm"><Clipboard className="w-4 h-4 mr-2" /> Colar CSV</Button>} />
              <ImportDialog selectedObraId={selectedObraId} selectedObraNome={selectedObra?.nome} trigger={<Button variant="outline" size="sm"><FileUp className="w-4 h-4 mr-2" /> Importar Arquivo</Button>} />
            </div>
          </div>
        </div>

        {renderContent()}
      </div>
      
      {selectedObraId && (
        <div className="fixed bottom-6 right-6 z-10">
          <EntryDialog 
            obraId={selectedObraId} 
            trigger={
              <Button size="lg" className="rounded-full shadow-lg h-14 w-14 p-0">
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