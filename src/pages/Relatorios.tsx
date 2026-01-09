import DashboardLayout from "@/components/layout/DashboardLayout";
import { useObras } from "@/hooks/use-obras";
import { useState, useEffect, useMemo } from "react";
import { Loader2, DollarSign, ClipboardCheck, Route, AlertTriangle, Clock, TrendingUp } from "lucide-react";
import ObraSelector from "@/components/financeiro/ObraSelector";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon } from "lucide-react";
import { DateRange } from "react-day-picker";
import { format, differenceInDays, differenceInMonths } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { useReportData, ReportData } from "@/hooks/use-report-data";
import KpiCard from "@/components/relatorios/KpiCard";
import ExportDialog from "@/components/relatorios/ExportDialog";
import { useActivitiesInPeriod, AtividadeWithProfile } from "@/hooks/use-activities-in-period";
import ActivityCostChart from "@/components/relatorios/ActivityCostChart";
import { formatCurrency } from "@/utils/formatters";
import { useKmCost } from "@/hooks/use-km-cost";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useIsMobile } from "@/hooks/use-mobile";

const Relatorios = () => {
  const { data: obras, isLoading: isLoadingObras } = useObras();
  const { data: kmCost, isLoading: isLoadingKmCost } = useKmCost();
  const [selectedObraId, setSelectedObraId] = useState<string | undefined>(undefined);
  const isMobile = useIsMobile();
  const [date, setDate] = useState<DateRange | undefined>(undefined); 

  useEffect(() => {
    if (obras && obras.length > 0 && !selectedObraId) {
      setSelectedObraId(obras[0].id);
    }
  }, [obras, selectedObraId]);

  const selectedObra = obras?.find(o => o.id === selectedObraId);

  useEffect(() => {
    if (selectedObra && selectedObra.data_inicio && !date) {
        setDate({
            from: new Date(selectedObra.data_inicio),
            to: new Date(),
        });
    }
  }, [selectedObra, date]);

  const startDateString = date?.from ? format(date.from, 'yyyy-MM-dd') : '';
  const endDateString = date?.to ? format(date.to, 'yyyy-MM-dd') : '';

  const { data: reportData, isLoading: isLoadingReport, error: reportError } = useReportData(
    selectedObraId || '',
    startDateString,
    endDateString
  );

  const { data: activitiesRaw, isLoading: isLoadingActivities, error: activitiesError } = useActivitiesInPeriod(
    selectedObraId || '',
    startDateString,
    endDateString
  );
  
  const activities: AtividadeWithProfile[] = activitiesRaw || [];

  const totalKmCost = (reportData?.totalMileagePeriod || 0) * (kmCost || 1.50);
  const totalActivityCost = (reportData?.totalTollsPeriod || 0) + totalKmCost;

  const periodoString = date?.from && date?.to 
    ? `${format(date.from, "dd/MM/yy")} a ${format(date.to, "dd/MM/yy")}`
    : "N/A";
    
  const timeRemaining = useMemo(() => {
    if (!selectedObra || !selectedObra.previsao_entrega) return "N/A";
    const today = new Date();
    const deliveryDate = new Date(selectedObra.previsao_entrega);
    if (selectedObra.status === 'concluida') return "Concluída";
    if (deliveryDate < today) return "Atrasada";
    const diffDays = differenceInDays(deliveryDate, today);
    if (diffDays > 60) return `${differenceInMonths(deliveryDate, today)} meses`;
    return `${diffDays} dias`;
  }, [selectedObra]);

  const renderContent = () => {
    if (isLoadingObras || isLoadingKmCost) {
      return (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }

    if (!selectedObraId) {
      return (
        <div className="text-center py-12 border border-dashed rounded-lg bg-muted/50">
          <p className="text-muted-foreground">Selecione uma obra para gerar o relatório.</p>
        </div>
      );
    }
    
    if (reportError || activitiesError) {
        return (
            <Alert variant="destructive" className="mt-6">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Erro ao carregar relatório</AlertTitle>
                <AlertDescription>Falha ao buscar dados.</AlertDescription>
            </Alert>
        );
    }
    
    if (isLoadingReport || isLoadingActivities) {
        return (
            <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
      <div className="space-y-6">
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            title="Status"
            value={selectedObra.status.charAt(0).toUpperCase() + selectedObra.status.slice(1)}
            description={`Início: ${format(new Date(selectedObra.data_inicio), 'dd/MM/yy')}`}
            icon={Clock}
            isLoading={false}
          />
          <KpiCard
            title="Tempo Restante"
            value={timeRemaining}
            description="Até a entrega prevista."
            icon={Clock}
            isLoading={false}
          />
          <KpiCard
            title="Gasto Total (Obra)"
            value={formatCurrency(reportData?.totalSpentObra)}
            description={`Orçamento: ${formatCurrency(reportData?.initialBudget)}`}
            icon={TrendingUp}
            isLoading={isLoadingReport}
          />
          <KpiCard
            title="Uso Orçamento"
            value={`${(reportData?.budgetUsedPercent || 0).toFixed(1)}%`}
            description={`Saldo: ${formatCurrency(reportData?.initialBudget - reportData?.totalSpentObra)}`}
            icon={DollarSign}
            isLoading={isLoadingReport}
          />
        </div>
        
        <div className="space-y-4">
            <h2 className="text-xl font-semibold">Métricas do Período</h2>
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                <KpiCard
                    title="Custo Atividades"
                    value={formatCurrency(totalActivityCost)}
                    description="Pedágio + KM rodado."
                    icon={DollarSign}
                    isLoading={isLoadingReport}
                />
                <KpiCard
                    title="Pedágios"
                    value={formatCurrency(reportData?.totalTollsPeriod)}
                    description="Total no período."
                    icon={DollarSign}
                    isLoading={isLoadingReport}
                />
                <KpiCard
                    title="KM Rodado"
                    value={`${(reportData?.totalMileagePeriod || 0).toFixed(0)} km`}
                    description={`Custo: ${formatCurrency(totalKmCost)}`}
                    icon={Route}
                    isLoading={isLoadingReport}
                />
                <KpiCard
                    title="Concluídas"
                    value={reportData?.activitiesCompleted ?? 0}
                    description="No período selecionado."
                    icon={ClipboardCheck}
                    isLoading={isLoadingReport}
                />
            </div>
        </div>
        
        <ActivityCostChart activities={activities} isLoading={isLoadingActivities} />

        <div className="flex justify-end pt-4">
          <ExportDialog 
            obraNome={selectedObra.nome} 
            periodo={periodoString} 
            reportData={reportData}
            activities={activities}
            kmCost={kmCost}
            isLoading={isLoadingReport || isLoadingActivities}
            selectedObra={selectedObra}
          />
        </div>
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 space-y-6 animate-in fade-in duration-500">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl sm:text-3xl font-bold">Relatórios</h1>
            <p className="text-sm text-muted-foreground">Análise de progresso e custos.</p>
          </div>
          <div className="flex flex-col gap-4">
            <div className="w-full sm:max-w-sm">
                <ObraSelector 
                  selectedObraId={selectedObraId} 
                  onSelectObra={setSelectedObraId} 
                />
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant={"outline"} className="w-full sm:w-[300px] justify-start text-left font-normal bg-background">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  <span className="truncate">
                      {date?.from ? (
                        date.to ? (
                          `${format(date.from, "dd/MM/yy")} - ${format(date.to, "dd/MM/yy")}`
                        ) : (
                          format(date.from, "dd/MM/yy")
                        )
                      ) : (
                        <span>Selecione um período</span>
                      )}
                  </span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
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