import DashboardLayout from "@/components/layout/DashboardLayout";
import { useObras } from "@/hooks/use-obras";
import { useState, useEffect, useMemo } from "react";
import { Loader2, DollarSign, ClipboardCheck, Route, AlertTriangle, Clock, TrendingUp, Zap, Users, CloudRain } from "lucide-react";
import ObraSelector from "@/components/financeiro/ObraSelector";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon } from "lucide-react";
import { DateRange } from "react-day-picker";
import { format, differenceInDays, differenceInMonths } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import KpiCard from "@/components/relatorios/KpiCard";
import ExportDialog from "@/components/relatorios/ExportDialog";
import { formatCurrency } from "@/utils/formatters";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useIsMobile } from "@/hooks/use-mobile";
import { ptBR } from "date-fns/locale";
import { useAuth } from "@/integrations/supabase/auth-provider";
import UpgradeButton from "@/components/subscription/UpgradeButton";
import { useRdoReportData } from "@/hooks/use-rdo-report-data";
import RdoWeatherChart from "@/components/relatorios/RdoWeatherChart";
import RdoOccurrenceTimeline from "@/components/relatorios/RdoOccurrenceTimeline";

const Relatorios = () => {
  const { profile } = useAuth();
  const isPro = profile?.subscription_status === 'active';
  
  const { data: obras, isLoading: isLoadingObras } = useObras();
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

  const { data: rdoMetrics, isLoading: isLoadingRdoMetrics, error: rdoError } = useRdoReportData(
    selectedObraId || '',
    startDateString,
    endDateString
  );

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
    if (isLoadingObras) {
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
    
    if (rdoError) {
        return (
            <Alert variant="destructive" className="mt-6">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Erro ao carregar relatório</AlertTitle>
                <AlertDescription>Falha ao buscar dados dos RDOs.</AlertDescription>
            </Alert>
        );
    }
    
    if (isLoadingRdoMetrics) {
        return (
            <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }
    
    const totalRdos = rdoMetrics?.allRdos.length || 0;
    const avgManpower = totalRdos > 0 ? Math.round((rdoMetrics?.totalManpower || 0) / totalRdos) : 0;

    return (
      <div className="space-y-6">
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            title="Status da Obra"
            value={selectedObra!.status.charAt(0).toUpperCase() + selectedObra!.status.slice(1)}
            description={`Início: ${format(new Date(selectedObra!.data_inicio), 'dd/MM/yy')}`}
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
            title="Total de Efetivo"
            value={rdoMetrics?.totalManpower ?? 0}
            description={`Média diária: ${avgManpower} funcionários`}
            icon={Users}
            isLoading={isLoadingRdoMetrics}
          />
          <KpiCard
            title="Atividades Concluídas"
            value={rdoMetrics?.completedActivitiesCount ?? 0}
            description={`Em ${totalRdos} RDOs no período.`}
            icon={ClipboardCheck}
            isLoading={isLoadingRdoMetrics}
          />
        </div>
        
        <div className="space-y-4">
            <h2 className="text-xl font-semibold">Métricas de Progresso e Condições</h2>
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                <KpiCard
                    title="Dias de Chuva"
                    value={rdoMetrics?.rainDays ?? 0}
                    description="Dias com Chuva Leve ou Forte."
                    icon={CloudRain}
                    isLoading={isLoadingRdoMetrics}
                />
                <KpiCard
                    title="RDOs Registrados"
                    value={totalRdos}
                    description={`No período de ${periodoString}`}
                    icon={FileText}
                    isLoading={isLoadingRdoMetrics}
                />
                <KpiCard
                    title="Ocorrências Registradas"
                    value={rdoMetrics?.occurrenceTimeline.length ?? 0}
                    description="Impedimentos ou comentários."
                    icon={AlertTriangle}
                    isLoading={isLoadingRdoMetrics}
                />
                <KpiCard
                    title="Uso Orçamento"
                    value={`N/A`}
                    description={`Filtre em Financeiro para ver custos.`}
                    icon={DollarSign}
                    isLoading={isLoadingRdoMetrics}
                />
            </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RdoWeatherChart metrics={rdoMetrics} isLoading={isLoadingRdoMetrics} />
            <RdoOccurrenceTimeline metrics={rdoMetrics} isLoading={isLoadingRdoMetrics} />
        </div>

        <div className="flex justify-end pt-4">
          {isPro ? (
            <ExportDialog 
              obraNome={selectedObra!.nome} 
              periodo={periodoString} 
              reportData={rdoMetrics} // Passando os novos dados
              activities={rdoMetrics?.allRdos} // Reutilizando o campo activities para passar todos os RDOs
              kmCost={0} // Não é mais relevante aqui, mas mantemos a prop
              isLoading={isLoadingRdoMetrics}
              selectedObra={selectedObra}
            />
          ) : (
            <Alert variant="default" className="bg-yellow-500/10 border-yellow-500/30 text-yellow-800 w-full lg:w-auto">
              <Zap className="h-4 w-4 text-yellow-600" />
              <AlertTitle className="text-yellow-700 font-bold">Recurso PRO</AlertTitle>
              <AlertDescription className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <span>A exportação de relatórios em PDF é exclusiva para assinantes PRO.</span>
                <UpgradeButton />
              </AlertDescription>
            </Alert>
          )}
        </div>
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 space-y-6 animate-in fade-in duration-500">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl sm:text-3xl font-bold">Relatórios de Progresso</h1>
            <p className="text-sm text-muted-foreground">Análise técnica e de condições da obra via RDO.</p>
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
                  <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
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