import AdminLayout from "@/components/layout/AdminLayout";
import { useAdminStats } from "@/hooks/use-admin-stats";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, LifeBuoy, TrendingUp, DollarSign, Loader2, Zap } from "lucide-react";
import { formatCurrency } from "@/utils/formatters";
import { cn } from "@/lib/utils";

const AdminDashboard = () => {
  const { data: stats, isLoading } = useAdminStats();

  if (isLoading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-purple-600" /></div>;

  const kpis = [
    { label: "Total de Usuários", value: stats?.totalUsers, icon: Users, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-900/20" },
    { label: "Tickets Abertos", value: stats?.openTickets, icon: LifeBuoy, color: "text-orange-600", bg: "bg-orange-50 dark:bg-orange-900/20" },
    { label: "Assinantes PRO", value: stats?.proUsers, icon: Zap, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
    { label: "Receita Est. (Mensal)", value: formatCurrency(stats?.estimatedRevenue || 0), icon: DollarSign, color: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-900/20" },
  ];

  return (
    <AdminLayout>
      <div className="space-y-10">
        <div className="space-y-1">
            <h1 className="text-3xl font-black uppercase tracking-tight text-slate-800 dark:text-slate-100">Métricas Vitais SaaS</h1>
            <p className="text-sm text-muted-foreground font-medium">Consolidado de performance do negócio.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {kpis.map((kpi, i) => (
                <Card key={i} className="border-none shadow-clean rounded-[2rem] overflow-hidden bg-card">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{kpi.label}</CardTitle>
                        <div className={cn("p-2 rounded-xl", kpi.bg)}><kpi.icon className={cn("w-4 h-4", kpi.color)} /></div>
                    </CardHeader>
                    <CardContent className="pt-2">
                        <div className="text-3xl font-black text-foreground">{kpi.value}</div>
                    </CardContent>
                </Card>
            ))}
        </div>

        <Card className="rounded-[2.5rem] border-none shadow-clean overflow-hidden bg-white dark:bg-slate-900">
            <CardHeader className="bg-slate-50 dark:bg-slate-800/50 border-b dark:border-slate-800 p-8">
                <CardTitle className="text-lg font-black uppercase flex items-center gap-2 text-slate-700 dark:text-slate-200">
                    <TrendingUp className="w-5 h-5 text-purple-600" /> Histórico de Crescimento
                </CardTitle>
            </CardHeader>
            <CardContent className="p-20 text-center text-muted-foreground">
                <p className="text-sm font-medium">Gráfico de evolução de cadastros em desenvolvimento...</p>
            </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;