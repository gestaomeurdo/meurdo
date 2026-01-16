import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/integrations/supabase/auth-provider";
import { useProfile } from "@/hooks/use-profile";
import { Loader2, Construction, DollarSign, AlertTriangle, Clock, FileText, Users, Plus } from "lucide-react";
import { formatCurrency } from "@/utils/formatters";
import { useRdoDashboardMetrics } from "@/hooks/use-rdo-dashboard-metrics";
import RecentRdoList from "@/components/dashboard/RecentRdoList";
import RdoDialog from "@/components/rdo/RdoDialog";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";

const Dashboard = () => {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const { data: rdoMetrics, isLoading: isLoadingRdoMetrics } = useRdoDashboardMetrics();
  const isMobile = useIsMobile();
  
  const firstName = profile?.first_name || user?.email?.split('@')[0] || "Usuário";

  const MetricCard = ({ title, value, description, icon: Icon, loading, className = "" }) => (
    <Card className={`shadow-sm border-l-4 border-l-primary ${className}`}>
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

  // Placeholder ID to trigger the Obra selection logic inside RdoDialog
  const dummyObraId = '00000000-0000-0000-0000-000000000000';

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground truncate">Bem-vindo(a), {firstName}!</h1>
          <p className="text-sm sm:text-lg text-muted-foreground">
            Visão geral dos Relatórios Diários de Obra (RDOs).
          </p>
        </div>
        
        {/* Main CTA Button */}
        <RdoDialog
          obraId={dummyObraId}
          date={new Date()}
          trigger={
            <Button 
              size="lg" 
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg font-semibold text-lg py-6"
            >
              <Plus className="w-6 h-6 mr-3" /> NOVO RDO
            </Button>
          }
        />

        {/* KPI Cards */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="RDOs Hoje"
            value={rdoMetrics?.rdosTodayCount ?? 0}
            description="Registros criados hoje."
            icon={FileText}
            loading={isLoadingRdoMetrics}
            className="border-l-primary"
          />
          <MetricCard
            title="Mão de Obra Total"
            value={rdoMetrics?.totalManpowerToday ?? 0}
            description="Efetivo total registrado hoje."
            icon={Users}
            loading={isLoadingRdoMetrics}
            className="border-l-green-500"
          />
          <MetricCard
            title="Pendentes"
            value={rdoMetrics?.pendingRdosCount ?? 0}
            description="RDOs não operacionais (últimos 7 dias)."
            icon={Clock}
            loading={isLoadingRdoMetrics}
            className="border-l-yellow-500"
          />
          <MetricCard
            title="Ocorrências Abertas"
            value={rdoMetrics?.openOccurrencesCount ?? 0}
            description="Impedimentos ou observações (últimos 7 dias)."
            icon={AlertTriangle}
            loading={isLoadingRdoMetrics}
            className="border-l-destructive"
          />
        </div>

        {/* Recent RDOs */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl">Diários Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <RecentRdoList 
              recentRdos={rdoMetrics?.recentRdos || []} 
              obraId={dummyObraId}
              isLoading={isLoadingRdoMetrics} 
            />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;