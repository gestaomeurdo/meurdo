import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useObras, Obra } from "@/hooks/use-obras";
import { useState, useMemo, useEffect } from "react";
import { Loader2, Plus, Clipboard } from "lucide-react";
import ObraSelector from "@/components/financeiro/ObraSelector";
import FinancialSummary from "@/components/financeiro/FinancialSummary";
import EntriesTable from "@/components/financeiro/EntriesTable";
import EntryDialog from "@/components/financeiro/EntryDialog";
import { useFinancialEntries } from "@/hooks/use-financial-entries";
import ExpenseCharts from "@/components/financeiro/ExpenseCharts";
import { Button } from "@/components/ui/button";
import PasteImportDialog from "@/components/financeiro/PasteImportDialog";

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

  const { data: entries, isLoading: isLoadingEntries, refetch } = useFinancialEntries({
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
          </div>
        </div>

        {selectedObra ? (
          <>
            <h2 className="text-xl font-semibold text-primary truncate">Obra Selecionada: {selectedObra.nome}</h2>
            <FinancialSummary obra={selectedObra} entries={entries} />
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
          <div className="text-center py-12 border border-dashed rounded-lg bg-muted/50">
            <p className="text-muted-foreground">
              Por favor, selecione uma obra no menu acima para visualizar e gerenciar os lançamentos financeiros.
            </p>
          </div>
        )}
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