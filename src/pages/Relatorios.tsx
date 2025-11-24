import DashboardLayout from "@/components/layout/DashboardLayout";
import { useObras } from "@/hooks/use-obras";
import { useState, useEffect } from "react";
import { Loader2, DollarSign, ClipboardCheck, Route } from "lucide-react";
import ObraSelector from "@/components/financeiro/ObraSelector";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon } from "lucide-react";
import { DateRange } from "react-day-picker";
import { format, startOfMonth } from "date-fns";
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
import { Atividade } from "@/hooks/use-atividades";

const Relatorios = () => {
  const { data: obras, isLoading: isLoadingObras } = useObras();
  const { data: kmCost, isLoading: isLoadingKmCost } = useKmCost();
  const [selectedObraId, setSelectedObraId] = useState<string | undefined>(undefined);
  const [date, setDate] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: new Date(),
  });

  // 1. Set the first obra as default when they load
  useEffect(() => {
    if (obras && obras.length > 0 && !selectedObraId) {
      setSelectedObraId(obras[0].id);
    }
  }, [obras, selectedObraId]);

  const selectedObra = obras?.find(o => o.id === selectedObraId);

  const startDateString = date?.from ? format(date.from, 'yyyy-MM-dd') : '';
  const endDateString = date?.to ? format(date.to, 'yyyy-MM-dd') : '';

  const { data: reportData, isLoading: isLoadingReport } = useReportData(
    selectedObraId || '',
    startDateString,
    endDateString
  );

  const { data: activitiesRaw, isLoading: isLoadingActivities } = useActivitiesInPeriod(
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
        <div className="grid gap-4 md:grid-cols-4">
          <KpiCard
            title="Custo Total Atividades (Período)"
            value={formatCurrency(totalActivityCost)}
            description={`Inclui pedágio e KM rodado (R$ ${kmCost?.toFixed(2)}/km).`}
            icon={DollarSign}
            isLoading={isLoadingReport}
          />
          <KpiCard
            title="Total Pedágio (Período)"
            value={formatCurrency(reportData?.totalTollsPeriod)}
            description="Custo total de pedágios registrados nas atividades."
            icon={DollarSign}
            isLoading={isLoadingReport}
          />
          <KpiCard
            title="Total KM Rodado (Período)"
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
          />
        </div>
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Relatórios de Atividades</h1>
            <p className="text-muted-foreground">Gere e exporte relatórios detalhados sobre as visitas e custos de deslocamento.</p>
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