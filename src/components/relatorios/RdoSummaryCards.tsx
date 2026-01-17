import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Calendar, CloudRain, FileText, Loader2 } from "lucide-react";
import { RdoReportMetrics } from "@/hooks/use-rdo-report-data";
import { cn } from "@/lib/utils";

interface RdoSummaryCardsProps {
  metrics: RdoReportMetrics | undefined;
  isLoading: boolean;
}

const RdoSummaryCards = ({ metrics, isLoading }: RdoSummaryCardsProps) => {
  const totalRdos = metrics?.allRdos.length || 0;
  const rainDays = metrics?.rainDays || 0;
  const totalManpower = metrics?.totalManpower || 0;
  
  const weatherSummary = () => {
    if (isLoading) return "Carregando...";
    if (totalRdos === 0) return "N/A";
    
    const operationalDays = totalRdos - rainDays;
    
    if (rainDays > operationalDays) {
        return "Mais Chuva que Sol";
    } else if (operationalDays > 0) {
        return "Predominantemente Sol";
    }
    return "N/A";
  };
  
  const weatherIcon = () => {
    if (isLoading) return Loader2;
    if (rainDays > 0) return CloudRain;
    return Calendar;
  };
  
  const IconComponent = weatherIcon();

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {/* Dias Trabalhados */}
      <Card className="border-l-4 border-l-primary shadow-clean">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium uppercase text-muted-foreground">Dias Trabalhados</CardTitle>
          <FileText className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          ) : (
            <div className="text-3xl font-bold text-primary">{totalRdos}</div>
          )}
          <p className="text-xs text-muted-foreground mt-1">RDOs preenchidos no período</p>
        </CardContent>
      </Card>
      
      {/* Clima */}
      <Card className={cn("border-l-4 shadow-clean", rainDays > 0 ? "border-l-blue-500" : "border-l-green-500")}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium uppercase text-muted-foreground">Clima</CardTitle>
          <IconComponent className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          ) : (
            <div className="text-3xl font-bold">{rainDays} dias de chuva</div>
          )}
          <p className="text-xs text-muted-foreground mt-1">{weatherSummary()}</p>
        </CardContent>
      </Card>

      {/* Mão de Obra */}
      <Card className="border-l-4 border-l-primary shadow-clean">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium uppercase text-muted-foreground">Mão de Obra</CardTitle>
          <Users className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          ) : (
            <div className="text-3xl font-bold">{totalManpower}</div>
          )}
          <p className="text-xs text-muted-foreground mt-1">Total de Homens-Dia acumulado</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default RdoSummaryCards;