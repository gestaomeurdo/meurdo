import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FinancialEntriesResult } from "@/hooks/use-financial-entries";
import { Obra } from "@/hooks/use-obras";
import { AlertTriangle, DollarSign, Calculator, Percent } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { formatCurrency } from "@/utils/formatters";
import { Skeleton } from "@/components/ui/skeleton";

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
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Orçamento da Obra</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-3/4" /> : <div className="text-2xl font-bold">{formatCurrency(orcamentoInicial)}</div>}
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-destructive">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Despesas (Ativas)</CardTitle>
            <Calculator className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-3/4" /> : (
              <div className="text-2xl font-bold text-destructive">
                {formatCurrency(totalFiltrado)}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">Excluindo itens marcados para ignorar</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Uso do Orçamento</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-3/4 mb-2" />
            ) : (
              <div className="text-2xl font-bold mb-2">{percentualUsado.toFixed(1)}%</div>
            )}
            <Progress value={Math.min(percentualUsado, 100)} className="h-2" indicatorClassName={getProgressColor()} />
          </CardContent>
        </Card>
      </div>

      {isCritical && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Orçamento Excedido!</AlertTitle>
          <AlertDescription>O total gasto (itens ativos) superou o orçamento inicial.</AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default FinancialSummary;