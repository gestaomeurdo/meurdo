import AdminLayout from "@/components/layout/AdminLayout";
import { useAdminStats } from "@/hooks/use-admin-stats";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, LifeBuoy, TrendingUp, DollarSign, Loader2, Zap } from "lucide-react";
import { formatCurrency } from "@/utils/formatters";
import { cn } from "@/lib/utils";

const AdminDashboard = () => {
  const { data: stats, isLoading } = useAdminStats();

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-white" />
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 animate-pulse">Sincronizando Métricas do Ecossistema</p>
        </div>
      </AdminLayout>
    );
  }

  const kpis = [
    { 
      label: "Total de Usuários", 
      value: stats?.totalUsers ?? 0, 
      icon: Users, 
      color: "text-blue-400", 
      bg: "bg-blue-900/20",
      border: "border-blue-500/20"
    },
    { 
      label: "Tickets Pendentes", 
      value: stats?.openTickets ?? 0, 
      icon: LifeBuoy, 
      color: "text-orange-400", 
      bg: "bg-orange-900/20",
      border: "border-orange-500/20"
    },
    { 
      label: "Membros Premium", 
      value: stats?.proUsers ?? 0, 
      icon: Zap, 
      color: "text-emerald-400", 
      bg: "bg-emerald-900/20",
      border: "border-emerald-500/20"
    },
    { 
      label: "MRR Estimado", 
      value: formatCurrency(stats?.estimatedRevenue || 0), 
      icon: DollarSign, 
      color: "text-purple-400", 
      bg: "bg-purple-900/20",
      border: "border-purple-500/20"
    },
  ];

  return (
    <AdminLayout>
      <div className="p-8 space-y-12 bg-slate-950 min-h-full">
        <div className="space-y-1">
            <h1 className="text-3xl font-black uppercase tracking-tight text-white">Console Operacional</h1>
            <p className="text-sm text-slate-500 font-medium tracking-tight">Análise de tração e saúde da plataforma SaaS.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {kpis.map((kpi, i) => (
                <Card key={i} className={cn("border-none shadow-2xl rounded-[2.5rem] overflow-hidden bg-slate-900 transition-all hover:-translate-y-1 hover:shadow-purple-950/10")}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-6">
                        <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-500">{kpi.label}</CardTitle>
                        <div className={cn("p-2.5 rounded-xl border", kpi.bg, kpi.border)}><kpi.icon className={cn("w-4 h-4", kpi.color)} /></div>
                    </CardHeader>
                    <CardContent className="px-6 pb-8">
                        <div className="text-4xl font-black text-white tracking-tighter">{kpi.value}</div>
                    </CardContent>
                </Card>
            ))}
        </div>

        <Card className="rounded-[3rem] border-none shadow-2xl overflow-hidden bg-slate-900/50 backdrop-blur-md">
            <CardHeader className="bg-slate-900/80 border-b border-slate-800 p-10 flex flex-row items-center justify-between">
                <CardTitle className="text-xl font-black uppercase flex items-center gap-3 text-white">
                    <TrendingUp className="w-6 h-6 text-purple-500" /> Curva de Crescimento
                </CardTitle>
                <Badge className="bg-purple-600/10 text-purple-400 border-purple-900/50 uppercase font-black text-[9px] tracking-widest">Tempo Real</Badge>
            </CardHeader>
            <CardContent className="p-32 text-center">
                <div className="flex flex-col items-center gap-6 opacity-30">
                    <div className="p-6 bg-slate-800 rounded-full border border-slate-700"><TrendingUp className="w-16 h-16 text-white" /></div>
                    <p className="text-xs font-black uppercase tracking-[0.4em] text-slate-400">Algoritmo de análise em standby...</p>
                </div>
            </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;