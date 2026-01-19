import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileClock, FileCheck, FileEdit, Users, DollarSign, CloudSun } from "lucide-react";
import { useMemo } from "react";
import { format, parseISO, isSameMonth, isSameYear } from "date-fns";
import { DiarioObra } from "@/hooks/use-rdo";
import { formatCurrency } from "@/utils/formatters";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface RdoDashboardProps {
  rdoList: DiarioObra[];
  currentDate: Date;
  isLoading: boolean;
}

const RdoDashboard = ({ rdoList, currentDate, isLoading }: RdoDashboardProps) => {
  const currentMonthRdos = useMemo(() => {
    return rdoList.filter(rdo => {
      const rdoDate = parseISO(rdo.data_rdo);
      return isSameMonth(rdoDate, currentDate) && isSameYear(rdoDate, currentDate);
    });
  }, [rdoList, currentDate]);

  const stats = useMemo(() => {
    const pending = currentMonthRdos.filter(r => r.status === 'pending' || r.status === 'rejected').length;
    const approved = currentMonthRdos.filter(r => r.status === 'approved').length;
    const draft = currentMonthRdos.filter(r => r.status === 'draft' || !r.status).length;
    
    const totalWorkers = currentMonthRdos.reduce((sum, rdo) => {
      return sum + (rdo.rdo_mao_de_obra?.reduce((mSum, m) => mSum + m.quantidade, 0) || 0);
    }, 0);
    
    const avgManpower = currentMonthRdos.length > 0 ? Math.round(totalWorkers / currentMonthRdos.length) : 0;

    const totalFinancial = currentMonthRdos.reduce((sum, rdo) => {
        const mCost = rdo.rdo_mao_de_obra?.reduce((mSum, m) => mSum + (m.quantidade * (m.custo_unitario || 0)), 0) || 0;
        const eCost = rdo.rdo_equipamentos?.reduce((eSum, e) => eSum + (e.horas_trabalhadas * (e.custo_hora || 0)), 0) || 0;
        return sum + mCost + eCost;
    }, 0);

    return { pending, approved, draft, avgManpower, totalFinancial };
  }, [currentMonthRdos]);

  if (isLoading) return <div className="grid gap-4 md:grid-cols-4 animate-pulse">{[1,2,3,4].map(i => <div key={i} className="h-32 bg-muted rounded-3xl" />)}</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center px-1">
        <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <CloudSun className="w-4 h-4" /> Painel de Controle Operacional
        </h3>
        <Badge variant="outline" className="text-[10px] font-bold border-primary/20 text-primary">
            Custo Estimado/Mês: {formatCurrency(stats.totalFinancial)}
        </Badge>
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Atenção */}
        <Card className="rounded-[2rem] border-none shadow-sm bg-white overflow-hidden group">
            <div className="h-1.5 w-full bg-orange-500"></div>
            <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                    <div className="p-3 rounded-2xl bg-orange-50 transition-transform group-hover:scale-110">
                        <FileClock className="w-6 h-6 text-orange-600" />
                    </div>
                </div>
                <div className="text-4xl font-black tracking-tight text-orange-600">{stats.pending}</div>
                <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mt-2">Aprovação Pendente</p>
            </CardContent>
        </Card>

        {/* Card 2: Sucesso */}
        <Card className="rounded-[2rem] border-none shadow-sm bg-white overflow-hidden group">
            <div className="h-1.5 w-full bg-emerald-500"></div>
            <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                    <div className="p-3 rounded-2xl bg-emerald-50 transition-transform group-hover:scale-110">
                        <FileCheck className="w-6 h-6 text-emerald-600" />
                    </div>
                </div>
                <div className="text-4xl font-black tracking-tight text-emerald-600">{stats.approved}</div>
                <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mt-2">RDOs Aprovados</p>
            </CardContent>
        </Card>

        {/* Card 3: Rascunho */}
        <Card className="rounded-[2rem] border-none shadow-sm bg-white overflow-hidden group">
            <div className="h-1.5 w-full bg-slate-400"></div>
            <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                    <div className="p-3 rounded-2xl bg-slate-100 transition-transform group-hover:scale-110">
                        <FileEdit className="w-6 h-6 text-slate-500" />
                    </div>
                </div>
                <div className="text-4xl font-black tracking-tight text-slate-700">{stats.draft}</div>
                <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mt-2">Em Rascunho</p>
            </CardContent>
        </Card>

        {/* Card 4: Efetivo */}
        <Card className="rounded-[2rem] border-none shadow-sm bg-white overflow-hidden group">
            <div className="h-1.5 w-full bg-blue-500"></div>
            <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                    <div className="p-3 rounded-2xl bg-blue-50 transition-transform group-hover:scale-110">
                        <Users className="w-6 h-6 text-blue-600" />
                    </div>
                </div>
                <div className="text-4xl font-black tracking-tight text-blue-700">{stats.avgManpower}</div>
                <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mt-2">Média de Efetivo</p>
            </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RdoDashboard;