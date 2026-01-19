import DashboardLayout from "@/components/layout/DashboardLayout";
import { useObras } from "@/hooks/use-obras";
import { useState, useEffect } from "react";
import { Loader2, AlertTriangle, FileText, Zap, Calendar as CalendarIcon, TrendingUp, Presentation } from "lucide-react";
import ObraSelector from "@/components/financeiro/ObraSelector";
import { Button } from "@/components/ui/button";
import { DateRange } from "react-day-picker";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import ExportDialog from "@/components/relatorios/ExportDialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useIsMobile } from "@/hooks/use-mobile";
import { ptBR } from "date-fns/locale";
import { useAuth } from "@/integrations/supabase/auth-provider";
import UpgradeButton from "@/components/subscription/UpgradeButton";
import { useRdoReportData } from "@/hooks/use-rdo-report-data";
import RdoSummaryCards from "@/components/relatorios/RdoSummaryCards";
import ActivityProgressList from "@/components/relatorios/ActivityProgressList";
import WorkforceEvolutionChart from "@/components/relatorios/WorkforceEvolutionChart";
import OccurrenceHorizontalTimeline from "@/components/relatorios/OccurrenceHorizontalTimeline";
import ActivityStatusTable from "@/components/relatorios/ActivityStatusTable";

const Relatorios = () => {
  const { profile } = useAuth();
  const isPro = profile?.subscription_status === 'active' || profile?.plan_type === 'pro';
  const { data: obras, isLoading: isLoadingObras } = useObras();
  const [selectedObraId, setSelectedObraId] = useState<string | undefined>(undefined);
  const isMobile = useIsMobile();

  const [date, setDate] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });

  useEffect(() => {
    if (obras && obras.length > 0 && !selectedObraId) {
      setSelectedObraId(obras[0].id);
    }
  }, [obras, selectedObraId]);

  const startDateString = date?.from ? format(date.from, 'yyyy-MM-dd') : '';
  const endDateString = date?.to ? format(date.to, 'yyyy-MM-dd') : '';

  const { 
    data: rdoMetrics, 
    isLoading: isLoadingRdoMetrics, 
    isFetching: isFetchingRdoMetrics,
    error: rdoError 
  } = useRdoReportData(
    selectedObraId || '',
    startDateString,
    endDateString
  );

  const periodoString = date?.from && date?.to 
    ? `${format(date.from, "dd/MM/yy")} a ${format(date.to, "dd/MM/yy")}` 
    : "Período não definido";

  const renderContent = () => {
    if (isLoadingObras) {
      return (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-muted-foreground">Buscando suas obras...</p>
        </div>
      );
    }

    if (!selectedObraId || selectedObraId === '00000000-0000-0000-0000-000000000000') {
      return (
        <div className="text-center py-20 border border-dashed rounded-3xl bg-muted/10">
          <Presentation className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground font-medium">Selecione uma obra para gerar o Dashboard Executivo.</p>
        </div>
      );
    }

    if (isLoadingRdoMetrics && isFetchingRdoMetrics) {
      return (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-sm font-black uppercase tracking-[0.2em] animate-pulse">Sincronizando Dados...</p>
        </div>
      );
    }

    if (rdoError) {
      return (
        <Alert variant="destructive" className="mt-6 border-2 border-destructive/20 rounded-2xl">
          <AlertTriangle className="h-5 w-5" />
          <AlertTitle className="font-bold">Erro ao processar dados</AlertTitle>
          <AlertDescription>Houve uma falha na comunicação com o banco de dados de campo.</AlertDescription>
        </Alert>
      );
    }

    if (!rdoMetrics || rdoMetrics.allRdos.length === 0) {
      return (
        <div className="text-center py-24 border border-dashed rounded-[3rem] bg-accent/5">
          <FileText className="w-16 h-16 mx-auto text-muted-foreground/20 mb-4" />
          <h2 className="text-xl font-bold mb-2 text-foreground">Sem histórico no período</h2>
          <p className="text-muted-foreground text-sm uppercase font-black tracking-widest">
            {periodoString}
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* KPI Cards Section */}
        <RdoSummaryCards metrics={rdoMetrics} isLoading={isFetchingRdoMetrics} />

        {/* Technical Data Section */}
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-8">
          <div className="lg:col-span-6">
            <ActivityProgressList obraId={selectedObraId} isLoading={isFetchingRdoMetrics} />
          </div>
          <div className="lg:col-span-4">
            <WorkforceEvolutionChart rdos={rdoMetrics.allRdos} isLoading={isFetchingRdoMetrics} />
          </div>
        </div>

        {/* Interactive Timeline */}
        <OccurrenceHorizontalTimeline rdos={rdoMetrics.allRdos} />

        {/* Detailed Status Table */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
          <ActivityStatusTable obraId={selectedObraId} />
        </div>

        {/* Export Action Bar */}
        <div className="bg-card p-8 rounded-[2.5rem] border dark:border-slate-800 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="space-y-1 text-center md:text-left">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Consolidação de Dados</p>
            <h4 className="text-lg font-bold text-foreground">Relatório Executivo de Performance</h4>
            <p className="text-xs text-muted-foreground">{rdoMetrics.allRdos.length} Diários analisados entre {periodoString}</p>
          </div>
          
          {isPro ? (
            <ExportDialog 
              obraNome={obras?.find(o => o.id === selectedObraId)?.nome || "Obra"} 
              periodo={periodoString} 
              reportData={rdoMetrics} 
              activities={rdoMetrics.allRdos} 
              kmCost={0} 
              isLoading={isFetchingRdoMetrics} 
              selectedObra={obras?.find(o => o.id === selectedObraId)} 
              startDate={startDateString}
              endDate={endDateString}
            />
          ) : (
            <div className="flex flex-col sm:flex-row items-center gap-4 bg-orange-50 dark:bg-orange-950/20 p-4 rounded-2xl border border-orange-100 dark:border-orange-900/30">
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-orange-600 dark:text-orange-400 fill-current" />
                <span className="text-[10px] font-black text-orange-800 dark:text-orange-300 uppercase">Upgrade para Exportar PDF Premium</span>
              </div>
              <UpgradeButton />
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-8 space-y-8 min-h-screen bg-transparent">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-1">
            <h1 className="text-3xl font-black uppercase tracking-tighter text-foreground">Relatórios de Campo</h1>
            <p className="text-sm text-muted-foreground font-medium">Visão executiva e controle técnico de produtividade.</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <div className="w-full sm:w-[300px]">
              <ObraSelector selectedObraId={selectedObraId} onSelectObra={setSelectedObraId} />
            </div>
            
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="h-10 justify-start text-left font-bold rounded-xl bg-card border-slate-200 dark:border-slate-800">
                  <CalendarIcon className="mr-2 h-4 w-4 text-primary dark:text-blue-400" />
                  <span className="truncate text-xs">
                    {date?.from ? (
                      date.to ? `${format(date.from, "dd/MM/yy")} - ${format(date.to, "dd/MM/yy")}` : format(date.from, "dd/MM/yy")
                    ) : "Filtrar Período"}
                  </span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 rounded-2xl shadow-2xl border-none" align="end">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={date?.from}
                  selected={date}
                  onSelect={setDate}
                  numberOfMonths={isMobile ? 1 : 2}
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {renderContent()}
      </div>
    </DashboardLayout>
  );
};

export default Relatorios;