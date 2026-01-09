import DashboardLayout from "@/components/layout/DashboardLayout";
import { useObras } from "@/hooks/use-obras";
import { useState, useEffect } from "react";
import { Loader2, ClipboardList, Plus, FileDown } from "lucide-react";
import ObraSelector from "@/components/financeiro/ObraSelector";
import { useAtividades } from "@/hooks/use-atividades";
import AtividadesTable from "@/components/atividades/AtividadesTable";
import AtividadeDialog from "@/components/atividades/AtividadeDialog";
import { Button } from "@/components/ui/button";
import { useExportActivitiesCsv } from "@/hooks/use-export-activities-csv";
import { format } from "date-fns";

const Atividades = () => {
  const { data: obras, isLoading: isLoadingObras } = useObras();
  const [selectedObraId, setSelectedObraId] = useState<string | undefined>(undefined);
  const { exportCsv, isExporting } = useExportActivitiesCsv();

  useEffect(() => {
    if (obras && obras.length > 0 && !selectedObraId) {
      setSelectedObraId(obras[0].id);
    }
  }, [obras, selectedObraId]);

  const { data: atividades, isLoading: isLoadingAtividades } = useAtividades(selectedObraId || '');
  
  const handleExport = () => {
    if (!selectedObraId) return;
    
    // Exporta todas as atividades da obra (usando um período amplo)
    const today = new Date();
    const farPast = new Date(2000, 0, 1); // Jan 1, 2000
    
    exportCsv({
      obraId: selectedObraId,
      startDate: format(farPast, 'yyyy-MM-dd'),
      endDate: format(today, 'yyyy-MM-dd'),
    });
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
          <ClipboardList className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Nenhuma obra encontrada</h2>
          <p className="text-muted-foreground">Crie uma obra primeiro para poder registrar atividades.</p>
        </div>
      );
    }

    if (isLoadingAtividades) {
      return (
        <div className="flex justify-center items-center h-full py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Carregando atividades...</span>
        </div>
      );
    }

    if (!atividades || atividades.length === 0) {
      return (
        <div className="text-center py-12 border border-dashed rounded-lg bg-muted/50">
          <ClipboardList className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Nenhuma atividade registrada</h2>
          <p className="text-muted-foreground mb-4">Comece adicionando a primeira atividade para esta obra.</p>
          <AtividadeDialog obraId={selectedObraId} />
        </div>
      );
    }

    return <AtividadesTable atividades={atividades} obraId={selectedObraId} />;
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h1 className="text-3xl font-bold">Atividades na Obra</h1>
          <div className="flex flex-wrap gap-3 items-center">
            <ObraSelector 
              selectedObraId={selectedObraId} 
              onSelectObra={setSelectedObraId} 
            />
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleExport}
              disabled={isExporting || !selectedObraId || (atividades?.length === 0 && !isLoadingAtividades)}
            >
              {isExporting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <FileDown className="w-4 h-4 mr-2" />
              )}
              Exportar Atividades CSV
            </Button>
          </div>
        </div>
        {renderContent()}
      </div>
      {selectedObraId && (
        <div className="fixed bottom-6 right-6 z-10">
          <AtividadeDialog 
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

export default Atividades;