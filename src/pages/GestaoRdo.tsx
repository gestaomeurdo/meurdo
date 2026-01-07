import DashboardLayout from "@/components/layout/DashboardLayout";
import { useObras } from "@/hooks/use-obras";
import { useState, useEffect, useMemo } from "react";
import { Loader2, FileText, Plus, CloudRain, Users, ClipboardCheck, LayoutGrid, List, AlertTriangle } from "lucide-react";
import ObraSelector from "@/components/financeiro/ObraSelector";
import RdoDialog from "@/components/rdo/RdoDialog";
import { Button } from "@/components/ui/button";
import { useRdoList } from "@/hooks/use-rdo";
import RdoListTable from "@/components/rdo/RdoListTable";
import RdoCalendar from "@/components/rdo/RdoCalendar";
import KpiCard from "@/components/relatorios/KpiCard";
import { format, parseISO, isSameMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const GestaoRdo = () => {
  const { data: obras, isLoading: isLoadingObras, error: obrasError } = useObras();
  const [selectedObraId, setSelectedObraId] = useState<string | undefined>(undefined);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<"lista" | "calendario">("calendario");

  useEffect(() => {
    if (obras && obras.length > 0 && !selectedObraId) {
      setSelectedObraId(obras[0].id);
    }
  }, [obras, selectedObraId]);

  const selectedObra = obras?.find(o => o.id === selectedObraId);
  const { data: rdoList, isLoading: isLoadingRdoList, error: rdoError } = useRdoList(selectedObraId || '');

  const summaryMetrics = useMemo(() => {
    if (!rdoList) return { daysWorked: 0, daysOfRain: 0 };
    
    // Filtra RDOs apenas do mês/ano que está sendo visualizado no calendário
    const filteredList = rdoList.filter(rdo => {
        const rdoDate = parseISO(rdo.data_rdo);
        return isSameMonth(rdoDate, currentDate);
    });

    const daysOfRain = filteredList.filter(rdo => rdo.clima_condicoes?.includes('Chuva')).length;
    
    return { 
        daysWorked: filteredList.length, 
        daysOfRain 
    };
  }, [rdoList, currentDate]);

  if (isLoadingObras) {
    return (
      <DashboardLayout>
        <div className="p-6 flex flex-col justify-center items-center h-[60vh] gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-muted-foreground animate-pulse">Carregando obras...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Gestão de RDO</h1>
            <p className="text-muted-foreground">Relatórios Diários e Acompanhamento Visual.</p>
          </div>
          <div className="flex flex-wrap gap-3 items-center">
            <ObraSelector selectedObraId={selectedObraId} onSelectObra={setSelectedObraId} />
            {selectedObraId && (
              <RdoDialog obraId={selectedObraId} date={new Date()} trigger={
                  <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg font-semibold">
                    <Plus className="w-5 h-5 mr-2" /> Novo RDO (Hoje)
                  </Button>
              } />
            )}
          </div>
        </div>

        {!selectedObraId ? (
          <Card className="border-dashed py-20 text-center">
            <CardContent>
              <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Selecione uma obra para gerenciar os RDOs.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <KpiCard 
                title="Registros no Mês" 
                value={summaryMetrics.daysWorked} 
                description={format(currentDate, 'MMMM yyyy', { locale: ptBR })}
                icon={FileText} 
                isLoading={isLoadingRdoList} 
              />
              <KpiCard 
                title="Ocorrências de Chuva" 
                value={summaryMetrics.daysOfRain} 
                icon={CloudRain} 
                isLoading={isLoadingRdoList} 
              />
              <KpiCard 
                title="Status Geral" 
                value={selectedObra?.status === 'ativa' ? 'Ativa' : 'Parada'} 
                icon={ClipboardCheck} 
                isLoading={false} 
              />
              <KpiCard 
                title="Total de Registros" 
                value={rdoList?.length || 0} 
                description="Histórico completo da obra"
                icon={Users} 
                isLoading={isLoadingRdoList} 
              />
            </div>

            <div className="flex justify-between items-center">
                <div className="bg-card border rounded-xl p-1 inline-flex">
                    <Button variant={view === "calendario" ? "secondary" : "ghost"} onClick={() => setView("calendario")} size="sm">
                        <LayoutGrid className="w-4 h-4 mr-2" /> Calendário
                    </Button>
                    <Button variant={view === "lista" ? "secondary" : "ghost"} onClick={() => setView("lista")} size="sm">
                        <List className="w-4 h-4 mr-2" /> Lista
                    </Button>
                </div>
                
                {view === "calendario" && (
                    <div className="flex gap-2 items-center bg-card p-1 border rounded-lg">
                        <Button variant="ghost" size="sm" onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}>Anterior</Button>
                        <span className="text-sm font-bold px-2 capitalize">{format(currentDate, 'MMMM yyyy', { locale: ptBR })}</span>
                        <Button variant="ghost" size="sm" onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}>Próximo</Button>
                    </div>
                )}
            </div>

            {view === "calendario" ? (
              <RdoCalendar obraId={selectedObraId} rdoList={rdoList || []} currentDate={currentDate} />
            ) : (
              <RdoListTable rdoList={rdoList || []} obraId={selectedObraId} isLoading={isLoadingRdoList} />
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default GestaoRdo;