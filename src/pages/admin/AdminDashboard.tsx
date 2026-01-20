import AdminLayout from "@/components/layout/AdminLayout";
import { useAdminStats } from "@/hooks/use-admin-stats";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, LifeBuoy, TrendingUp, DollarSign, Loader2, Zap, AlertTriangle } from "lucide-react";
import { formatCurrency } from "@/utils/formatters";
import { cn } from "@/lib/utils";

const AdminDashboard = () => {
  const { data: stats, isLoading, isError, refetch } = useAdminStats();

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-[#066abc]" />
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Acessando Banco de Dados...</p>
        </div>
      </AdminLayout>
    );
  }

  if (isError) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center h-[60vh] gap-6 p-8 text-center">
          <div className="bg-red-500/10 p-6 rounded-full border border-red-500/20">
            <AlertTriangle className="h-12 w-12 text-red-500" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-black uppercase text-white">Falha na Autenticação Admin</h2>
            <p className="text-slate-400 max-w-sm mx-auto text-sm font-medium">
              O banco de dados recusou a consulta. Verifique se o RLS está configurado para o seu e-mail.
            </p>
          </div>
          <button 
            onClick={() => refetch()}
            className="bg-slate-800 text-white px-8 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-700 transition-all"
          >
            Tentar Novamente
          </button>
        </div>
      </AdminLayout>
    );
  }

  const kpis = [
    { label: "Total de Usuários", value: stats?.totalUsers ?? 0, icon: Users, color: "text-blue-400", bg: "bg-blue-500/10" },
    { label: "Chamados Abertos", value: stats?.openTickets ?? 0, icon: LifeBuoy, color: "text-orange-400", bg: "bg-orange-500/10" },
    { label: "Usuários PRO", value: stats?.proUsers ?? 0, icon: Zap, color: "text-emerald-400", bg: "bg-emerald-500/10" },
    { label: "MRR Projetado", value: formatCurrency(stats?.estimatedRevenue || 0), icon: DollarSign, color: "text-primary", bg: "bg-primary/10" },
  ];

  return (
    <AdminLayout>
      <div className="p-6 sm:p-10 space-y-10">
        <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white">Painel Operacional</h1>
            <p className="text-sm text-slate-500 font-medium tracking-tight">Monitoramento global da infraestrutura Meu RDO.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {kpis.map((kpi, i) => (
                <Card key={i} className="border-slate-800 shadow-sm rounded-[2rem] overflow-hidden bg-slate-900 transition-all hover:border-slate-700">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-6">
                        <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-500">{kpi.label}</CardTitle>
                        <div className={cn("p-2 rounded-lg", kpi.bg)}><kpi.icon className={cn("w-4 h-4", kpi.color)} /></div>
                    </CardHeader>
                    <CardContent className="px-6 pb-8">
                        <div className="text-4xl font-black text-white tracking-tighter">{kpi.value}</div>
                    </CardContent>
                </Card>
            ))}
        </div>

        <Card className="rounded-[2.5rem] border-slate-800 shadow-sm overflow-hidden bg-slate-900">
            <CardHeader className="bg-slate-800/50 border-b border-slate-800 p-8 flex flex-row items-center justify-between">
                <CardTitle className="text-lg font-black uppercase flex items-center gap-3 text-white">
                    <TrendingUp className="w-5 h-5 text-[#066abc]" /> Atividade da Plataforma
                </CardTitle>
                <Badge className="bg-[#066abc]/10 text-primary border-primary/20 uppercase font-black text-[8px] tracking-widest">Tempo Real</Badge>
            </CardHeader>
            <CardContent className="p-20 text-center">
                <div className="flex flex-col items-center gap-4 opacity-20">
                    <TrendingUp className="w-12 h-12 text-slate-400" />
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Algoritmo de análise em standby...</p>
                </div>
            </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;