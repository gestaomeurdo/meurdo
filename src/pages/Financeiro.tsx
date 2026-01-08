import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useObras, Obra } from "@/hooks/use-obras";
import { useState, useMemo, useEffect } from "react";
import { Loader2, Plus, Clipboard, FileUp, Filter, AlertTriangle, Settings } from "lucide-react";
import ObraSelector from "@/components/financeiro/ObraSelector";
import FinancialSummary from "@/components/financeiro/FinancialSummary";
import EntriesTable from "@/components/financeiro/EntriesTable";
import EntryDialog from "@/components/financeiro/EntryDialog";
import { useFinancialEntries } from "@/hooks/use-financial-entries";
import ExpenseCharts from "@/components/financeiro/ExpenseCharts";
import { Button } from "@/components/ui/button";
import PasteImportDialog from "@/components/financeiro/PasteImportDialog";
import ImportDialog from "@/components/financeiro/ImportDialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import CategoryManagementDialog from "@/components/financeiro/CategoryManagementDialog";

const Financeiro = () => {
  const { data: obras, isLoading: isLoadingObras } = useObras();
  const [selectedObraId, setSelectedObraId] = useState<string | undefined>(undefined);
  const [filters, setFilters] = useState({});

  useEffect(() => {
    if (obras && obras.length > 0 && !selectedObraId) {
      setSelectedObraId(obras[0].id);
    }
  }, [obras, selectedObraId]);

  const selectedObra: Obra | undefined = useMemo(() => {
    return obras?.find(o => o.id === selectedObraId);
  }, [obras, selectedObraId]);

  const { data: entries, isLoading: isLoadingEntries, error: entriesError, refetch } = useFinancialEntries({
    obraId: selectedObraId || '',
    ...filters,
  });

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

  const renderContent = () => {
    if (!selectedObra) {
      return (
        <div className="text-center py-12 border border-dashed rounded-lg bg-muted/50">
          <p className="text-muted-foreground">
            Por favor, selecione uma obra no menu acima para visualizar e gerenciar os lançamentos financeiros.
          </p>
        </div>
      );
    }
    
    if (entriesError) {
      return (
        <Alert variant="destructive" className="mt-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Erro ao carregar lançamentos</AlertTitle>
          <AlertDescription>
            Ocorreu um erro ao buscar os dados financeiros. Verifique as permissões (RLS) ou a conexão.
            <p className="mt-2 text-sm italic">Detalhe: {entriesError.message}</p>
          </AlertDescription>
        </Alert>
      );
    }

    return (
      <>
        <h2 className="text-xl font-semibold text-primary truncate">Obra Selecionada: {selectedObra.nome}</h2>
        <FinancialSummary obra={selectedObra} entries={entries} />
        
        {isLoadingEntries ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">Carregando lançamentos...</span>
          </div>
        ) : hasEntries ? (
          <>
            <ExpenseCharts entries={entries} />
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Lançamentos de Despesas</CardTitle>
              </CardHeader>
              <CardContent>
                <EntriesTable 
                  entries={entries} 
                  obraId={selectedObraId!} 
                  isLoading={isLoadingEntries} 
                  refetch={refetch}
                  setFilters={setFilters}
                />
              </CardContent>
            </Card>
          </>
        ) : (
          <Card className="mt-6">
            <CardContent className="text-center py-12">
              <Filter className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">Nenhum lançamento encontrado</h2>
              <p className="text-muted-foreground mb-4">
                Comece adicionando um novo lançamento financeiro ou importe dados.
              </p>
              <EntryDialog obraId={selectedObraId!} />
            </CardContent>
          </Card>
        )}
      </>
    );
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
          <h1 className="text-3xl font-bold">Controle Financeiro</h1>
          <div className="flex flex-wrap gap-3 items-center">
            <ObraSelector 
              selectedObraId={selectedObraId} 
              onSelectObra={setSelectedObraId} 
            />
            <div className="flex gap-2">
              <CategoryManagementDialog 
                trigger={
                  <Button variant="outline" className="flex items-center">
                    <Settings className="w-4 h-4 mr-2" />
                    Categorias
                  </Button>
                }
              />
              <PasteImportDialog 
                selectedObraId={selectedObraId}
                selectedObraNome={selectedObra?.nome}
                trigger={
                  <Button variant="outline" className="flex items-center">
                    <Clipboard className="w-4 h-4 mr-2" />
                    Colar CSV
                  </Button>
                }
              />
              <ImportDialog 
                selectedObraId={selectedObraId}
                selectedObraNome={selectedObra?.nome}
                trigger={
                  <Button variant="outline" className="flex items-center">
                    <FileUp className="w-4 h-4 mr-2" />
                    Importar Arquivo
                  </Button>
                }
              />
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
              <Button size="lg" className="rounded-full shadow-lg">
                <Plus className="w-6 h-6" />
              </Button>
            }
          />
        </div>
      )}
    </DashboardLayout>
  );
};

export default Financeiro;