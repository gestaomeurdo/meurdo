import DashboardLayout from "@/components/layout/DashboardLayout";
import { useObras } from "@/hooks/use-obras";
import { useState, useEffect, useMemo } from "react";
import { Loader2, DollarSign, ClipboardCheck, Route, AlertTriangle, Clock, TrendingUp, Zap, Users, CloudRain, FileText } from "lucide-react";
import ObraSelector from "@/components/financeiro/ObraSelector";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon } from "lucide-react";
import { DateRange } from "react-day-picker";
import { format, differenceInDays, differenceInMonths } from "date-fns";
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
import RdoOccurrenceTimeline from "@/components/relatorios/RdoOccurrenceTimeline";
import RdoSummaryCards from "@/components/relatorios/RdoSummaryCards";
import RdoActivityProgressChart from "@/components/relatorios/RdoActivityProgressChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
    
    if (isLoadingRdoMetrics) {
        return (
            <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2">Carregando dados do RDO...</span>
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
    
    if (rdoMetrics && rdoMetrics.allRdos.length === 0) {
        return (
            <div className="text-center py-12 border border-dashed rounded-lg bg-muted/50">
                <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h2 className="text-xl font-semibold mb-2">Ainda não há dados de RDO</h2>
                <p className="text-muted-foreground">Nenhum Relatório Diário de Obra encontrado para o período selecionado.</p>
            </div>
        );
    }
    
    return (
      <div className="space-y-6">
        {/* 1. Cards de Resumo */}
        <RdoSummaryCards metrics={rdoMetrics} isLoading={isLoadingRdoMetrics} />
        
        {/* 2. Gráfico de Progresso e Linha do Tempo */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RdoActivityProgressChart metrics={rdoMetrics} isLoading={isLoadingRdoMetrics} />
            
            {/* Linha do Tempo de Ocorrências (Top 5) */}
            <Card className="col-span-full lg:col-span-1">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-destructive" />
                        Ocorrências Recentes
                    </CardTitle>
                </CardHeader>
                <CardContent className="h-[350px] p-0">
                    <RdoOccurrenceTimeline metrics={{ 
                        ...rdoMetrics!, 
                        occurrenceTimeline: (rdoMetrics?.occurrenceTimeline || []).slice(0, 5) 
                    }} isLoading={isLoadingRdoMetrics} />
                </CardContent>
            </Card>
        </div>

        <div className="flex justify-end pt-4">
          {isPro ? (
            <ExportDialog 
              obraNome={selectedObra!.nome} 
              periodo={periodoString} 
              reportData={rdoMetrics} 
              activities={rdoMetrics?.allRdos} 
              kmCost={0} 
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
            <h1 className="text-2xl sm:text-3xl font-bold">Relatório Técnico Simplificado</h1>
            <p className="text-sm text-muted-foreground">Resumo de progresso e condições da obra.</p>
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