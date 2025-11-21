import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FinancialEntry } from "@/hooks/use-financial-entries";
import { Obra } from "@/hooks/use-obras";
import { AlertTriangle, DollarSign, TrendingUp, Percent } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";

interface FinancialSummaryProps {
  obra: Obra;
  entries: FinancialEntry[] | undefined;
}

const FinancialSummary = ({ obra, entries }: FinancialSummaryProps) => {
  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const totalGasto = entries?.reduce((sum, entry) => sum + entry.valor, 0) || 0;
  const orcamentoInicial = obra.orcamento_inicial || 0;
  const saldoDisponivel = orcamentoInicial - totalGasto;
  const percentualUsado = orcamentoInicial > 0 ? (totalGasto / orcamentoInicial) * 100 : 0;

  const isWarning = percentualUsado >= 80 && percentualUsado < 100;
  const isCritical = percentualUsado >= 100;

  const getProgressColor = () => {
    if (isCritical) return "bg-destructive";
    if (isWarning) return "bg-yellow-500";
    return "bg-primary";
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Orçamento Inicial</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(orcamentoInicial)}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Gasto</CardTitle>
            <TrendingUp className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{formatCurrency(totalGasto)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Disponível</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${saldoDisponivel < 0 ? 'text-destructive' : 'text-green-600'}`}>
              {formatCurrency(saldoDisponivel)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Uso do Orçamento</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-2">{percentualUsado.toFixed(1)}%</div>
            <Progress value={Math.min(percentualUsado, 100)} className="h-2" indicatorClassName={getProgressColor()} />
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {isCritical && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Orçamento Estourado!</AlertTitle>
          <AlertDescription>
            O total gasto ({formatCurrency(totalGasto)}) excedeu o orçamento inicial ({formatCurrency(orcamentoInicial)}).
          </AlertDescription>
        </Alert>
      )}
      {isWarning && (
        <Alert className="bg-yellow-100 border-yellow-400 text-yellow-800 dark:bg-yellow-900 dark:border-yellow-600 dark:text-yellow-200">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Atenção ao Orçamento</AlertTitle>
          <AlertDescription>
            Você já utilizou {percentualUsado.toFixed(1)}% do orçamento inicial da obra.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default FinancialSummary;