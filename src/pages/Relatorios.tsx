import DashboardLayout from "@/components/layout/DashboardLayout";
import { useObras } from "@/hooks/use-obras";
import { useState, useEffect } from "react";
import { Loader2, AlertTriangle, FileText, Zap, Calendar as CalendarIcon } from "lucide-react";
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
import RdoOccurrenceTimeline from "@/components/relatorios/RdoOccurrenceTimeline";
import RdoSummaryCards from "@/components/relatorios/RdoSummaryCards";
import RdoActivityProgressChart from "@/components/relatorios/RdoActivityProgressChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Relatorios = () => {
  const { profile } = useAuth();
  const isPro = profile?.subscription_status === 'active' || profile?.plan_type === 'pro';
  const { data: obras, isLoading: isLoadingObras } = useObras();
  const [selectedObraId, setSelectedObraId] = useState<string | undefined>(undefined);
  const isMobile = useIsMobile();

  // Inicializa SEMPRE com o mês atual para garantir performance e relevância
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
          <FileText className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground font-medium">Selecione uma obra para visualizar os indicadores.</p>
        </div>
      );
    }

    if (isLoadingRdoMetrics && isFetchingRdoMetrics) {
      return (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-muted-foreground animate-pulse font-bold uppercase tracking-widest text-xs">
            Processando dados de campo...
          </p>
        </div>
      );
    }

    if (rdoError) {
      return (
        <Alert variant="destructive" className="mt-6 border-2">
          <AlertTriangle className="h-5 w-5" />
          <AlertTitle className="font-bold">Erro ao gerar relatório</AlertTitle>
          <AlertDescription>
            Não conseguimos processar os diários desta obra. Verifique sua conexão ou permissões.
            <div className="mt-2 text-[10px] font-mono opacity-70 bg-black/5 p-2 rounded">
              {rdoError.message}
            </div>
          </AlertDescription>
        </Alert>
      );
    }

    if (!rdoMetrics || rdoMetrics.allRdos.length === 0) {
      return (
        <div className="text-center py-20 border border-dashed rounded-3xl bg-accent/5">
          <FileText className="w-16 h-16 mx-auto text-muted-foreground/20 mb-4" />
          <h2 className="text-xl font-bold mb-2">Sem registros no período</h2>
          <p className="text-muted-foreground max-w-xs mx-auto">
            Não encontramos nenhum RDO entre {periodoString}. Tente alterar o filtro de datas acima.
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <RdoSummaryCards metrics={rdoMetrics} isLoading={isFetchingRdoMetrics} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <RdoActivityProgressChart metrics={rdoMetrics} isLoading={isFetchingRdoMetrics} />
          
          <Card className="shadow-clean border-none rounded-3xl overflow-hidden">
            <CardHeader className="bg-muted/30">
              <CardTitle className="flex items-center gap-2 text-lg font-bold">
                <AlertTriangle className="w-5 h-5 text-destructive" />
                Eventos e Impedimentos
              </CardTitle>
            </CardHeader>
            <CardContent className="h-[350px] p-0">
              <RdoOccurrenceTimeline metrics={rdoMetrics} isLoading={isFetchingRdoMetrics} />
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-6 border-t">
          <div className="text-xs text-muted-foreground font-medium uppercase tracking-widest">
            {rdoMetrics.allRdos.length} dias analisados neste relatório
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
            />
          ) : (
            <div className="bg-yellow-500/5 border border-yellow-500/20 p-4 rounded-2xl flex flex-col sm:flex-row items-center gap-4">
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-600 fill-current" />
                <span className="text-xs font-bold text-yellow-800 uppercase">Exportação em PDF exclusiva PRO</span>
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
      <div className="p-4 sm:p-6 space-y-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-black uppercase tracking-tighter">Relatórios de Campo</h1>
          <p className="text-sm text-muted-foreground font-medium">Análise técnica de produtividade e ocorrências.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-card p-4 border rounded-2xl shadow-sm">
          <ObraSelector selectedObraId={selectedObraId} onSelectObra={setSelectedObraId} />
          
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className="w-full justify-start text-left font-normal rounded-xl bg-background"
              >
                <CalendarIcon className="mr-2 h-4 w-4 shrink-0 text-primary" />
                <span className="truncate">
                  {date?.from ? (
                    date.to ? (
                      `${format(date.from, "dd/MM/yy")} - ${format(date.to, "dd/MM/yy")}`
                    ) : (
                      format(date.from, "dd/MM/yy")
                    )
                  ) : (
                    <span>Selecione o Período</span>
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

        {renderContent()}
      </div>
    </DashboardLayout>
  );
};

export default Relatorios;