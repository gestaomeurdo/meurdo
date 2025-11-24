import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, DollarSign, TrendingUp, Percent, Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

interface FinancialSummaryProps {
  data: {
    orcamentoInicial: number;
    totalGasto: number;
    saldoDisponivel: number;
    percentualUsado: number;
  } | undefined;
  isLoading: boolean;
}

const SummaryCard = ({ title, value, icon: Icon, loading, valueClassName = "" }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      {loading ? (
        <Skeleton className="h-8 w-3/4" />
      ) : (
        <div className={`text-2xl font-bold ${valueClassName}`}>{value}</div>
      )}
    </CardContent>
  </Card>
);

const FinancialSummary = ({ data, isLoading }: FinancialSummaryProps) => {
  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const isWarning = (data?.percentualUsado ?? 0) >= 80 && (data?.percentualUsado ?? 0) < 100;
  const isCritical = (data?.percentualUsado ?? 0) >= 100;

  const getProgressColor = () => {
    if (isCritical) return "bg-destructive";
    if (isWarning) return "bg-yellow-500";
    return "bg-primary";
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <SummaryCard 
          title="Orçamento Inicial" 
          value={formatCurrency(data?.orcamentoInicial ?? 0)} 
          icon={DollarSign} 
          loading={isLoading} 
        />
        <SummaryCard 
          title="Total Gasto" 
          value={formatCurrency(data?.totalGasto ?? 0)} 
          icon={TrendingUp} 
          loading={isLoading}
          valueClassName="text-destructive"
        />
        <SummaryCard 
          title="Saldo Disponível" 
          value={formatCurrency(data?.saldoDisponivel ?? 0)} 
          icon={DollarSign} 
          loading={isLoading}
          valueClassName={(data?.saldoDisponivel ?? 0) < 0 ? 'text-destructive' : 'text-green-600'}
        />
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Uso do Orçamento</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-1/2 mb-2" />
            ) : (
              <div className="text-2xl font-bold mb-2">{(data?.percentualUsado ?? 0).toFixed(1)}%</div>
            )}
            <Progress value={Math.min(data?.percentualUsado ?? 0, 100)} className="h-2" indicatorClassName={getProgressColor()} />
          </CardContent>
        </Card>
      </div>

      {!isLoading && isCritical && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Orçamento Estourado!</AlertTitle>
          <AlertDescription>
            O total gasto ({formatCurrency(data?.totalGasto ?? 0)}) excedeu o orçamento inicial ({formatCurrency(data?.orcamentoInicial ?? 0)}).
          </AlertDescription>
        </Alert>
      )}
      {!isLoading && isWarning && (
        <Alert className="bg-yellow-100 border-yellow-400 text-yellow-800 dark:bg-yellow-900 dark:border-yellow-600 dark:text-yellow-200">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Atenção ao Orçamento</AlertTitle>
          <AlertDescription>
            Você já utilizou {(data?.percentualUsado ?? 0).toFixed(1)}% do orçamento inicial da obra.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default FinancialSummary;