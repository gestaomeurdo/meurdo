import AdminLayout from "@/components/layout/AdminLayout";
import { useAdminStats } from "@/hooks/use-admin-stats";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, LifeBuoy, TrendingUp, DollarSign, Loader2, Zap, AlertTriangle, Activity } from "lucide-react";
import { formatCurrency } from "@/utils/formatters";
import { cn } from "@/lib/utils";

const AdminDashboard = () => {
  const { data: stats, isLoading, isError, refetch } = useAdminStats();

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-[#066abc]" />
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Autenticando God Mode...</p>
        </div>
      </AdminLayout>
    );
  }

  if (isError) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center h-[60vh] gap-6 p-8 text-center">
          <div className="bg-red-500/10 p-6 rounded-[2.5rem] border border-red-500/20">
            <AlertTriangle className="h-12 w-12 text-red-500" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-black uppercase text-white tracking-tighter">Acesso Negado ou RLS Bloqueado</h2>
            <p className="text-slate-400 max-w-sm mx-auto text-sm font-medium">
              Sua conta não possui privilégios 'Super Admin' no banco de dados.
            </p>
          </div>
          <button 
            onClick={() => refetch()}
            className="bg-slate-800 text-white px-8 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-700 transition-all border border-slate-700 shadow-xl"
          >
            Tentar Reconectar
          </button>
        </div>
      </AdminLayout>
    );
  }

  const kpis = [
    { label: "Usuários Totais", value: stats?.totalUsers ?? 0, icon: Users, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
    { label: "Chamados Abertos", value: stats?.openTickets ?? 0, icon: LifeBuoy, color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/20" },
    { label: "Membros PRO", value: stats?.proUsers ?? 0, icon: Zap, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
    { label: "Receita Est. (Mensal)", value: formatCurrency(stats?.estimatedRevenue || 0), icon: DollarSign, color: "text-blue-500", bg: "bg-blue-600/10", border: "border-blue-600/20" },
  ];

  return (
    <AdminLayout>
      <div className="p-8 sm:p-12 space-y-12 max-w-7xl mx-auto">
        <div className="space-y-2">
            <h1 className="text-4xl font-black uppercase tracking-tighter text-white">Painel Operacional</h1>
            <p className="text-slate-500 font-medium tracking-tight">Monitoramento global da infraestrutura Meu RDO.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {kpis.map((kpi, i) => (
                <Card key={i} className="border-slate-800 shadow-2xl rounded-[2.5rem] overflow-hidden bg-slate-900/50 backdrop-blur-md transition-all hover:scale-[1.02] hover:border-slate-700 group">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-8">
                        <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-500">{kpi.label}</CardTitle>
                        <div className={cn("p-3 rounded-2xl border transition-transform group-hover:rotate-12", kpi.bg, kpi.border)}><kpi.icon className={cn("w-5 h-5", kpi.color)} /></div>
                    </CardHeader>
                    <CardContent className="px-8 pb-10">
                        <div className="text-4xl font-black text-white tracking-tighter">{kpi.value}</div>
                    </CardContent>
                </Card>
            ))}
        </div>

        <Card className="rounded-[3rem] border-slate-800 shadow-2xl overflow-hidden bg-slate-900/50 backdrop-blur-md">
            <CardHeader className="bg-slate-900/80 border-b border-slate-800 p-8 flex flex-row items-center justify-between">
                <CardTitle className="text-lg font-black uppercase flex items-center gap-3 text-white">
                    <Activity className="w-5 h-5 text-blue-500" /> Atividade em Tempo Real
                </CardTitle>
                <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 uppercase font-black text-[9px] tracking-widest px-3 py-1">Sincronizado</Badge>
            </CardHeader>
            <CardContent className="p-32 text-center">
                <div className="flex flex-col items-center gap-6 opacity-20 group">
                    <div className="p-8 bg-blue-500/10 rounded-full animate-pulse"><TrendingUp className="w-16 h-16 text-blue-500" /></div>
                    <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-400">Processando métricas de engajamento...</p>
                </div>
            </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;