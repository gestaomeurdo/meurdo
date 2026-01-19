import { Card, CardContent } from "@/components/ui/card";
import { FileClock, FileCheck, FileEdit, Users, CloudSun } from "lucide-react";
import { useMemo } from "react";
import { parseISO, isSameMonth, isSameYear } from "date-fns";
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
        <Badge variant="outline" className="text-[10px] font-black border-primary/20 text-primary dark:bg-primary/5 uppercase px-3">
            Custo Estimado/Mês: {formatCurrency(stats.totalFinancial)}
        </Badge>
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Aprovação Pendente", value: stats.pending, icon: FileClock, color: "bg-orange-500", text: "text-orange-600 dark:text-orange-400", bg: "bg-orange-50 dark:bg-orange-500/10" },
          { label: "RDOs Aprovados", value: stats.approved, icon: FileCheck, color: "bg-emerald-500", text: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-500/10" },
          { label: "Em Rascunho", value: stats.draft, icon: FileEdit, color: "bg-slate-400", text: "text-slate-500 dark:text-slate-400", bg: "bg-slate-100 dark:bg-slate-500/10" },
          { label: "Média de Efetivo", value: stats.avgManpower, icon: Users, color: "bg-blue-500", text: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-500/10" },
        ].map((item, i) => (
          <Card key={i} className="rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-clean bg-card overflow-hidden group">
              <div className={cn("h-1 w-full", item.color)}></div>
              <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                      <div className={cn("p-3 rounded-2xl transition-transform group-hover:scale-110", item.bg)}>
                          <item.icon className={cn("w-6 h-6", item.text)} />
                      </div>
                  </div>
                  <div className="text-4xl font-black tracking-tight text-foreground">{item.value}</div>
                  <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mt-2">{item.label}</p>
              </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default RdoDashboard;