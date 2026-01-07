import DashboardLayout from "@/components/layout/DashboardLayout";
import { useObras } from "@/hooks/use-obras";
import { useState, useEffect, useMemo } from "react";
import { Loader2, FileText, Plus, CloudRain, Users, Calendar as CalendarIcon, ClipboardCheck, Info, LayoutGrid, List } from "lucide-react";
import ObraSelector from "@/components/financeiro/ObraSelector";
import RdoDialog from "@/components/rdo/RdoDialog";
import { Button } from "@/components/ui/button";
import { useRdoList, DiarioObra } from "@/hooks/use-rdo";
import RdoListTable from "@/components/rdo/RdoListTable";
import RdoCalendar from "@/components/rdo/RdoCalendar";
import KpiCard from "@/components/relatorios/KpiCard";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const GestaoRdo = () => {
  const { data: obras, isLoading: isLoadingObras } = useObras();
  const [selectedObraId, setSelectedObraId] = useState<string | undefined>(undefined);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<"lista" | "calendario">("calendario");

  useEffect(() => {
    if (obras && obras.length > 0 && !selectedObraId) {
      setSelectedObraId(obras[0].id);
    }
  }, [obras, selectedObraId]);

  const selectedObra = obras?.find(o => o.id === selectedObraId);
  const { data: rdoList, isLoading: isLoadingRdoList } = useRdoList(selectedObraId || '');

  const lastRdo = rdoList && rdoList.length > 0 ? rdoList[0] : null;

  const summaryMetrics = useMemo(() => {
    if (!rdoList) return { daysWorked: 0, daysOfRain: 0 };
    const currentMonth = format(currentDate, 'yyyy-MM');
    let daysWorked = 0;
    let daysOfRain = 0;
    rdoList.forEach(rdo => {
      const rdoMonth = format(parseISO(rdo.data_rdo), 'yyyy-MM');
      if (rdoMonth === currentMonth) {
        daysWorked++;
        if (rdo.clima_condicoes?.includes('Chuva')) daysOfRain++;
      }
    });
    return { daysWorked, daysOfRain };
  }, [rdoList, currentDate]);

  if (isLoadingObras) {
    return <DashboardLayout><div className="p-6 flex justify-center items-center h-[60vh]"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div></DashboardLayout>;
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
                  <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg font-semibold"><Plus className="w-5 h-5 mr-2" /> Novo RDO (Hoje)</Button>
              } />
            )}
          </div>
        </div>

        {!selectedObraId ? (
          <Card className="border-dashed py-20 text-center"><CardContent><p className="text-muted-foreground">Selecione uma obra.</p></CardContent></Card>
        ) : (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <KpiCard title="Dias de Obra (Mês)" value={summaryMetrics.daysWorked} icon={FileText} isLoading={isLoadingRdoList} />
              <KpiCard title="Ocorrências de Chuva" value={summaryMetrics.daysOfRain} icon={CloudRain} isLoading={isLoadingRdoList} />
              <KpiCard title="Mão de Obra Média" value="Ver RDO" icon={Users} isLoading={false} />
              <KpiCard title="Status Geral" value={selectedObra?.status === 'ativa' ? 'Ativa' : 'Parada'} icon={ClipboardCheck} isLoading={false} />
            </div>

            <div className="bg-card border rounded-xl p-1 inline-flex">
              <Button variant={view === "calendario" ? "secondary" : "ghost"} onClick={() => setView("calendario")} size="sm"><LayoutGrid className="w-4 h-4 mr-2" /> Calendário</Button>
              <Button variant={view === "lista" ? "secondary" : "ghost"} onClick={() => setView("lista")} size="sm"><List className="w-4 h-4 mr-2" /> Lista</Button>
            </div>

            {view === "calendario" ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center bg-card p-4 rounded-xl border">
                  <h2 className="text-xl font-bold capitalize">{format(currentDate, 'MMMM yyyy', { locale: ptBR })}</h2>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))}>Anterior</Button>
                    <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>Hoje</Button>
                    <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))}>Próximo</Button>
                  </div>
                </div>
                <RdoCalendar obraId={selectedObraId} rdoList={rdoList || []} currentDate={currentDate} />
              </div>
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