import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/integrations/supabase/auth-provider";
import { useProfile } from "@/hooks/use-profile";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { Loader2, Construction, DollarSign, AlertTriangle, Clock } from "lucide-react";
import BudgetChart from "@/components/dashboard/BudgetChart";
import { formatCurrency } from "@/utils/formatters";

const Dashboard = () => {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const { data, isLoading } = useDashboardData();
  
  const firstName = profile?.first_name || user?.email?.split('@')[0] || "Usuário";

  const MetricCard = ({ title, value, description, icon: Icon, loading }) => (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium truncate pr-2">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        ) : (
          <div className="text-xl sm:text-2xl font-bold truncate">{value}</div>
        )}
        <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 line-clamp-2">
          {description}
        </p>
      </CardContent>
    </Card>
  );

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold truncate">Olá, {firstName}!</h1>
          <p className="text-sm sm:text-lg text-muted-foreground">
            Resumo do Diário de Obra.
          </p>
        </div>
        
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Obras Ativas"
            value={data?.activeObrasCount ?? 0}
            description="Progresso das suas construções."
            icon={Construction}
            loading={isLoading}
          />
          <MetricCard
            title="Orçamento Total"
            value={formatCurrency(data?.totalInitialBudget ?? 0)}
            description="Soma dos orçamentos iniciais."
            icon={DollarSign}
            loading={isLoading}
          />
          <MetricCard
            title="Alertas"
            value={0}
            description="Itens pendentes detectados."
            icon={AlertTriangle}
            loading={false}
          />
          <MetricCard
            title="Agenda"
            value={"N/A"}
            description="Próximas atividades planejadas."
            icon={Clock}
            loading={false}
          />
        </div>

        <div className="grid grid-cols-1 gap-6">
          <BudgetChart data={data?.chartData} isLoading={isLoading} />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;