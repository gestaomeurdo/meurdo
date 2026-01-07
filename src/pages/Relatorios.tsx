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

const Relatorios = () => {
  const { data: obras, isLoading: isLoadingObras } = useObras();
  const { data: kmCost, isLoading: isLoadingKmCost } = useKmCost();
  const [selectedObraId, setSelectedObraId] = useState<string | undefined>(undefined);
  
  // Initialize date range to undefined, will be set in useEffect
  const [date, setDate] = useState<DateRange | undefined>(undefined); 

  // 1. Set the first obra as default when they load
  useEffect(() => {
    if (obras && obras.length > 0 && !selectedObraId) {
      setSelectedObraId(obras[0].id);
    }
  }, [obras, selectedObraId]);

  const selectedObra = obras?.find(o => o.id === selectedObraId);

  // 2. Set default date range (Start of Obra to Today) when selectedObra changes
  useEffect(() => {
    if (selectedObra && selectedObra.data_inicio && !date) {
        // Set default range from obra start date to today
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
    
    if (deliveryDate < today) {
        return "Atrasada";
    }
    
    const diffDays = differenceInDays(deliveryDate, today);
    
    if (diffDays > 60) {
        const diffMonths = differenceInMonths(deliveryDate, today);
        return `${diffMonths} meses restantes`;
    }
    return `${diffDays} dias restantes`;
  }, [selectedObra]);

  const renderContent = () => {
    if (isLoadingObras || isLoadingKmCost) {
      return (
        <div className="flex justify-center items-center h-full py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Carregando configurações e obras...</span>
        </div>
      );
    }

    if (!selectedObra || !selectedObraId) {
      return (
        <div className="text-center py-12 border border-dashed rounded-lg bg-muted/50">
          <p className="text-muted-foreground">Selecione uma obra no menu acima para gerar um relatório.</p>
        </div>
      );
    }
    
    // Check for errors in data fetching
    if (reportError || activitiesError) {
        const error = reportError || activitiesError;
        return (
            <Alert variant="destructive" className="mt-6">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Erro ao carregar dados do Relatório</AlertTitle>
                <AlertDescription>
                    Ocorreu um erro ao buscar os dados. Verifique as permissões (RLS) ou a função RPC.
                    <p className="mt-2 text-sm italic">Detalhe: {error.message}</p>
                </AlertDescription>
            </Alert>
        );
    }
    
    // If obra is selected but data is loading
    if (isLoadingReport || isLoadingActivities) {
        return (
            <div className="flex justify-center items-center h-full py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2">Carregando dados do relatório...</span>
            </div>
        );
    }

    return (
      <div className="space-y-6">
        {/* Overall Project Summary */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            title="Status da Obra"
            value={selectedObra.status.charAt(0).toUpperCase() + selectedObra.status.slice(1)}
            description={`Iniciada em ${format(new Date(selectedObra.data_inicio), 'dd/MM/yyyy')}`}
            icon={Clock}
            isLoading={false}
          />
          <KpiCard
            title="Tempo Restante (Previsão)"
            value={timeRemaining}
            description={selectedObra.previsao_entrega ? `Entrega prevista: ${format(new Date(selectedObra.previsao_entrega), 'dd/MM/yyyy')}` : "Previsão de entrega não definida."}
            icon={Clock}
            isLoading={false}
          />
          <KpiCard
            title="Gasto Total (Obra)"
            value={formatCurrency(reportData?.totalSpentObra)}
            description={`Orçamento inicial: ${formatCurrency(reportData?.initialBudget)}`}
            icon={TrendingUp}
            isLoading={isLoadingReport}
          />
          <KpiCard
            title="Uso do Orçamento"
            value={`${(reportData?.budgetUsedPercent || 0).toFixed(1)}%`}
            description={`Saldo: ${formatCurrency(reportData?.initialBudget - reportData?.totalSpentObra)}`}
            icon={DollarSign}
            isLoading={isLoadingReport}
          />
        </div>
        
        <h2 className="text-2xl font-semibold pt-4">Métricas do Período ({periodoString})</h2>
        <div className="grid gap-4 md:grid-cols-4">
          <KpiCard
            title="Custo Total Atividades"
            value={formatCurrency(totalActivityCost)}
            description={`Inclui pedágio e KM rodado (R$ ${kmCost?.toFixed(2)}/km).`}
            icon={DollarSign}
            isLoading={isLoadingReport}
          />
          <KpiCard
            title="Total Pedágio"
            value={formatCurrency(reportData?.totalTollsPeriod)}
            description="Custo total de pedágios registrados nas atividades."
            icon={DollarSign}
            isLoading={isLoadingReport}
          />
          <KpiCard
            title="Total KM Rodado"
            value={`${(reportData?.totalMileagePeriod || 0).toFixed(0)} km`}
            description={`Custo de KM: ${formatCurrency(totalKmCost)}`}
            icon={Route}
            isLoading={isLoadingReport}
          />
          <KpiCard
            title="Atividades Concluídas"
            value={reportData?.activitiesCompleted ?? 0}
            description="Total de atividades marcadas como 'Concluída' no período."
            icon={ClipboardCheck}
            isLoading={isLoadingReport}
          />
        </div>
        
        <ActivityCostChart activities={activities} isLoading={isLoadingActivities} />

        <div className="flex justify-end">
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
      <div className="p-6 space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
          <div>
            <h1 className="text-3xl font-bold">Relatórios de Obra</h1>
            <p className="text-muted-foreground">Gere e exporte relatórios detalhados sobre o progresso e custos.</p>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <ObraSelector 
              selectedObraId={selectedObraId} 
              onSelectObra={setSelectedObraId} 
            />
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="date"
                  variant={"outline"}
                  className={cn(
                    "w-full md:w-[300px] justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date?.from ? (
                    date.to ? (
                      <>
                        {format(date.from, "LLL dd, y")} -{" "}
                        {format(date.to, "LLL dd, y")}
                      </>
                    ) : (
                      format(date.from, "LLL dd, y")
                    )
                  ) : (
                    <span>Selecione um período</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={date?.from}
                  selected={date}
                  onSelect={setDate}
                  numberOfMonths={2}
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