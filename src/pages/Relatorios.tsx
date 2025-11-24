import DashboardLayout from "@/components/layout/DashboardLayout";
import { useObras } from "@/hooks/use-obras";
import { useState, useEffect } from "react";
import { Loader2, DollarSign, Percent, ClipboardCheck } from "lucide-react";
import ObraSelector from "@/components/financeiro/ObraSelector";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon } from "lucide-react";
import { DateRange } from "react-day-picker";
import { format, startOfMonth } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { useReportData } from "@/hooks/use-report-data";
import KpiCard from "@/components/relatorios/KpiCard";
import ExportDialog from "@/components/relatorios/ExportDialog";

const Relatorios = () => {
  const { data: obras, isLoading: isLoadingObras } = useObras();
  const [selectedObraId, setSelectedObraId] = useState<string | undefined>(undefined);
  const [date, setDate] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: new Date(),
  });

  useEffect(() => {
    if (obras && obras.length > 0 && !selectedObraId) {
      setSelectedObraId(obras[0].id);
    }
  }, [obras, selectedObraId]);

  const selectedObra = obras?.find(o => o.id === selectedObraId);

  const { data: reportData, isLoading: isLoadingReport } = useReportData(
    selectedObraId || '',
    date?.from ? format(date.from, 'yyyy-MM-dd') : '',
    date?.to ? format(date.to, 'yyyy-MM-dd') : ''
  );

  const formatCurrency = (value: number | undefined) => {
    if (value === undefined) return "R$ 0,00";
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const periodoString = date?.from && date?.to 
    ? `${format(date.from, "dd/MM/yy")} a ${format(date.to, "dd/MM/yy")}`
    : "N/A";

  const renderContent = () => {
    if (isLoadingObras) {
      return (
        <div className="flex justify-center items-center h-full py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }

    if (!selectedObra) {
      return (
        <div className="text-center py-12 border border-dashed rounded-lg bg-muted/50">
          <p className="text-muted-foreground">Selecione uma obra para gerar um relatório.</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <KpiCard
            title="Total Gasto no Período"
            value={formatCurrency(reportData?.totalSpent)}
            description={`Orçamento inicial da obra: ${formatCurrency(reportData?.initialBudget)}`}
            icon={DollarSign}
            isLoading={isLoadingReport}
          />
          <KpiCard
            title="% do Orçamento Gasto (Total)"
            value={`${(reportData?.budgetUsedPercent || 0).toFixed(1)}%`}
            description="Percentual do gasto total sobre o orçamento inicial."
            icon={Percent}
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
        
        <div className="flex justify-end">
          <ExportDialog obraNome={selectedObra.nome} periodo={periodoString} />
        </div>

        <div className="text-center py-12 border border-dashed rounded-lg bg-muted/50">
          <p className="text-muted-foreground">
            Área para visualização detalhada do relatório (gráficos, tabelas, etc.).
          </p>
        </div>
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Relatórios</h1>
            <p className="text-muted-foreground">Gere e exporte relatórios detalhados sobre suas obras.</p>
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