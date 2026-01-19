import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FinancialEntriesResult } from "@/hooks/use-financial-entries";
import { Obra } from "@/hooks/use-obras";
import { AlertTriangle, DollarSign, Calculator, Percent } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { formatCurrency } from "@/utils/formatters";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface FinancialSummaryProps {
  obra: Obra;
  entriesResult: FinancialEntriesResult | undefined;
  isLoading: boolean;
}

const FinancialSummary = ({ obra, entriesResult, isLoading }: FinancialSummaryProps) => {
  const entries = entriesResult?.entries;
  
  // REGRA: Soma apenas os itens que NÃO estão marcados como 'ignorar_soma'
  const totalFiltrado = entries?.filter(e => !e.ignorar_soma).reduce((sum, entry) => sum + entry.valor, 0) || 0;
  
  const orcamentoInicial = obra.orcamento_inicial || 0;
  const percentualUsado = orcamentoInicial > 0 ? (totalFiltrado / orcamentoInicial) * 100 : 0;

  const isWarning = percentualUsado >= 80 && percentualUsado < 100;
  const isCritical = percentualUsado >= 100;

  const getProgressColor = () => {
    if (isCritical) return "bg-destructive";
    if (isWarning) return "bg-yellow-500";
    return "bg-primary";
  };
  
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        {/* Card Orçamento - Corrigido para não ser azul sólido no dark */}
        <Card className="border-l-4 border-l-blue-500 dark:bg-slate-900 shadow-sm overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Orçamento da Obra</CardTitle>
            <div className="p-2 bg-blue-500/10 rounded-lg"><DollarSign className="h-4 w-4 text-blue-500" /></div>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-3/4" /> : <div className="text-2xl font-black">{formatCurrency(orcamentoInicial)}</div>}
            <p className="text-[9px] font-bold text-muted-foreground uppercase mt-1">Valor Total Planejado</p>
          </CardContent>
        </Card>
        
        {/* Card Despesas - Corrigido para não ser vermelho sólido no dark */}
        <Card className="border-l-4 border-l-red-500 dark:bg-slate-900 shadow-sm overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Despesas Ativas</CardTitle>
            <div className="p-2 bg-red-500/10 rounded-lg"><Calculator className="h-4 w-4 text-red-500" /></div>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-3/4" /> : (
              <div className="text-2xl font-black text-red-500">
                {formatCurrency(totalFiltrado)}
              </div>
            )}
            <p className="text-[9px] font-bold text-muted-foreground uppercase mt-1">Soma de lançamentos confirmados</p>
          </CardContent>
        </Card>

        {/* Card Progresso */}
        <Card className="border-l-4 border-l-slate-400 dark:bg-slate-900 shadow-sm overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Uso do Orçamento</CardTitle>
            <div className="p-2 bg-slate-400/10 rounded-lg"><Percent className="h-4 w-4 text-slate-500" /></div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-3/4 mb-2" />
            ) : (
              <div className="text-2xl font-black mb-2">{percentualUsado.toFixed(1)}%</div>
            )}
            <Progress value={Math.min(percentualUsado, 100)} className="h-2" indicatorClassName={getProgressColor()} />
          </CardContent>
        </Card>
      </div>

      {isCritical && (
        <Alert variant="destructive" className="rounded-2xl border-2 border-red-500/20 bg-red-500/5">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle className="font-black uppercase text-xs tracking-widest">Orçamento Excedido!</AlertTitle>
          <AlertDescription className="text-sm">O total gasto (itens ativos) superou o orçamento inicial previsto para esta obra.</AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default FinancialSummary;