import DashboardLayout from "@/components/layout/DashboardLayout";
import { useObras } from "@/hooks/use-obras";
import { useState, useEffect, useMemo } from "react";
import { Loader2, FileText, Plus, Sun, CloudRain, Users } from "lucide-react";
import ObraSelector from "@/components/financeiro/ObraSelector";
import RdoDialog from "@/components/rdo/RdoDialog";
import { Button } from "@/components/ui/button";
import { useRdoList, DiarioObra } from "@/hooks/use-rdo";
import RdoListTable from "@/components/rdo/RdoListTable";
import KpiCard from "@/components/relatorios/KpiCard";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

const GestaoRdo = () => {
  const { data: obras, isLoading: isLoadingObras } = useObras();
  const [selectedObraId, setSelectedObraId] = useState<string | undefined>(undefined);
  const today = useMemo(() => new Date(), []);

  useEffect(() => {
    if (obras && obras.length > 0 && !selectedObraId) {
      setSelectedObraId(obras[0].id);
    }
  }, [obras, selectedObraId]);

  const selectedObra = obras?.find(o => o.id === selectedObraId);
  
  const { data: rdoList, isLoading: isLoadingRdoList } = useRdoList(selectedObraId || '');

  // --- Summary Metrics Calculation (Client-side for simplicity) ---
  const summaryMetrics = useMemo(() => {
    if (!rdoList) return { daysWorked: 0, daysOfRain: 0, totalManpower: 'N/A' };

    const currentMonth = format(today, 'yyyy-MM');
    let daysWorked = 0;
    let daysOfRain = 0;
    
    // Find the most recent RDO in the list
    const mostRecentRdo = rdoList.length > 0 ? rdoList[0] : null;
    
    // Calculate days worked and days of rain for the current month
    rdoList.forEach(rdo => {
      const rdoMonth = format(parseISO(rdo.data_rdo), 'yyyy-MM');
      
      if (rdoMonth === currentMonth) {
        daysWorked++;
        if (rdo.clima_condicoes?.includes('Chuva')) {
          daysOfRain++;
        }
      }
    });

    // Total manpower is complex to calculate without fetching details for all RDOs.
    // We will show a placeholder for now, as the list fetch doesn't include manpower details.
    const totalManpower = 'N/A (Detalhes)'; 

    return { daysWorked, daysOfRain, totalManpower };
  }, [rdoList, today]);
  // --- End Summary Metrics ---

  const renderContent = () => {
    if (isLoadingObras) {
      return (
        <div className="flex justify-center items-center h-full py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Carregando configurações e obras...</span>
        </div>
      );
    }

    if (!selectedObraId) {
      return (
        <div className="text-center py-12 border border-dashed rounded-lg bg-muted/50">
          <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Nenhuma obra encontrada</h2>
          <p className="text-muted-foreground">Selecione ou crie uma obra para gerenciar os RDOs.</p>
        </div>
      );
    }
    
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-primary truncate">Obra Selecionada: {selectedObra?.nome}</h2>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <KpiCard
            title="Dias Trabalhados (Mês)"
            value={summaryMetrics.daysWorked}
            description={`RDOs registrados em ${format(today, 'MMMM', { locale: ptBR })}.`}
            icon={FileText}
            isLoading={isLoadingRdoList}
          />
          <KpiCard
            title="Dias de Chuva (Mês)"
            value={summaryMetrics.daysOfRain}
            description="RDOs com condição climática de chuva."
            icon={CloudRain}
            isLoading={isLoadingRdoList}
          />
          <KpiCard
            title="Efetivo (Último RDO)"
            value={summaryMetrics.totalManpower}
            description="Total de mão de obra registrada no último RDO (requer abertura do RDO para cálculo)."
            icon={Users}
            isLoading={isLoadingRdoList}
          />
        </div>

        {/* RDO List Table */}
        <RdoListTable 
          rdoList={rdoList} 
          obraId={selectedObraId} 
          isLoading={isLoadingRdoList} 
        />
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
          <h1 className="text-3xl font-bold">Gestão de RDO (Diário de Obra)</h1>
          <div className="flex flex-wrap gap-3 items-center">
            <ObraSelector 
              selectedObraId={selectedObraId} 
              onSelectObra={setSelectedObraId} 
            />
            {selectedObraId && (
              <RdoDialog 
                obraId={selectedObraId} 
                date={today} 
                trigger={
                  <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                    <Plus className="w-6 h-6 mr-2" />
                    Novo RDO (Hoje)
                  </Button>
                }
              />
            )}
          </div>
        </div>

        {renderContent()}
      </div>
    </DashboardLayout>
  );
};

export default GestaoRdo;