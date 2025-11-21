import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/integrations/supabase/auth-provider";
import { useProfile } from "@/hooks/use-profile";
import { useDashboardMetrics } from "@/hooks/use-dashboard-data";
import { Loader2, Construction, DollarSign, AlertTriangle, Clock } from "lucide-react";
import BudgetChart from "@/components/dashboard/BudgetChart";

const Dashboard = () => {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const { data: metrics, isLoading: isLoadingMetrics } = useDashboardMetrics();
  
  const firstName = profile?.first_name || user?.email?.split('@')[0] || "Usuário";

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const MetricCard = ({ title, value, description, icon: Icon, loading }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        ) : (
          <div className="text-2xl font-bold">{value}</div>
        )}
        <p className="text-xs text-muted-foreground mt-1">
          {description}
        </p>
      </CardContent>
    </Card>
  );

  return (
    <DashboardLayout>
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-2">Bem-vindo(a), {firstName}!</h1>
        <p className="text-lg text-muted-foreground mb-6">
          Visão geral do Gestão de Obras – Power Construtor.
        </p>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <MetricCard
            title="Obras Ativas"
            value={metrics?.activeObrasCount ?? 0}
            description="Acompanhe o progresso das suas construções."
            icon={Construction}
            loading={isLoadingMetrics}
          />
          <MetricCard
            title="Orçamento Total (Inicial)"
            value={formatCurrency(metrics?.totalInitialBudget ?? 0)}
            description="Soma dos orçamentos iniciais de todas as obras."
            icon={DollarSign}
            loading={isLoadingMetrics}
          />
          <MetricCard
            title="Alertas Pendentes"
            value={0}
            description="Orçamento, materiais ou documentos."
            icon={AlertTriangle}
            loading={false}
          />
          <MetricCard
            title="Próxima Tarefa"
            value={"N/A"}
            description="Agenda de Mão de Obra."
            icon={Clock}
            loading={false}
          />
        </div>

        {/* Power BI-like Visualization */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <BudgetChart />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;