import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Calendar, Package, FileText, Loader2, HardDrive } from "lucide-react";
import { RdoReportMetrics } from "@/hooks/use-rdo-report-data";
import { cn } from "@/lib/utils";

interface RdoSummaryCardsProps {
  metrics: RdoReportMetrics | undefined;
  isLoading: boolean;
}

const RdoSummaryCards = ({ metrics, isLoading }: RdoSummaryCardsProps) => {
  const totalRdos = metrics?.allRdos.length || 0;
  const totalManpower = metrics?.totalManpower || 0;
  const materialsCount = metrics?.totalMaterialsReceived || 0;

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {/* Efetivo Acumulado */}
      <Card className="border-l-4 border-l-[#066abc] shadow-clean bg-card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs font-black uppercase text-muted-foreground tracking-widest">Efetivo Acumulado</CardTitle>
          <Users className="h-4 w-4 text-[#066abc]" />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          ) : (
            <div className="text-3xl font-black text-[#066abc]">{totalManpower}</div>
          )}
          <p className="text-[10px] font-bold text-muted-foreground mt-1 uppercase">Total de Homens-Dia no campo</p>
        </CardContent>
      </Card>
      
      {/* Materiais Recebidos */}
      <Card className="border-l-4 border-l-green-500 shadow-clean bg-card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs font-black uppercase text-muted-foreground tracking-widest">Insumos & Materiais</CardTitle>
          <Package className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          ) : (
            <div className="text-3xl font-black text-green-600">{materialsCount}</div>
          )}
          <p className="text-[10px] font-bold text-muted-foreground mt-1 uppercase">Entradas registradas no período</p>
        </CardContent>
      </Card>

      {/* RDOs Preenchidos */}
      <Card className="border-l-4 border-l-orange-500 shadow-clean bg-card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs font-black uppercase text-muted-foreground tracking-widest">Engajamento de Campo</CardTitle>
          <FileText className="h-4 w-4 text-orange-500" />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          ) : (
            <div className="text-3xl font-black text-orange-500">{totalRdos} RDOs</div>
          )}
          <p className="text-[10px] font-bold text-muted-foreground mt-1 uppercase">Relatórios gerados pela equipe</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default RdoSummaryCards;