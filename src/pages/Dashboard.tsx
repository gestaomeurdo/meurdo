import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/integrations/supabase/auth-provider";
import { Loader2, Plus } from "lucide-react";
import { useRdoDashboardMetrics } from "@/hooks/use-rdo-dashboard-metrics";
import RecentRdoList from "@/components/dashboard/RecentRdoList";
import RdoDialog from "@/components/rdo/RdoDialog";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { showSuccess } from "@/utils/toast";

const Dashboard = () => {
  const { user, isLoading: authLoading, profile } = useAuth();
  const { data: rdoMetrics, isLoading: isLoadingRdoMetrics } = useRdoDashboardMetrics();
  const location = useLocation();
  const queryClient = useQueryClient();

  // Efeito para verificar o retorno do Stripe e forçar a atualização do perfil
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const sessionId = params.get('session_id');

    if (sessionId) {
      // Limpa o parâmetro da URL
      window.history.replaceState({}, document.title, location.pathname);
      
      // Invalida a query do perfil para forçar o SessionContextProvider a buscar os dados atualizados
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      showSuccess("Pagamento confirmado! Seu plano PRO está ativo.");
    }
  }, [location.search, queryClient]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const firstName = profile?.first_name || user?.email?.split('@')[0] || "Usuário";
  const dummyObraId = '00000000-0000-0000-0000-000000000000';

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground truncate">Bem-vindo(a), {firstName}!</h1>
          <p className="text-muted-foreground">Aqui está o resumo da sua operação hoje.</p>
        </div>
        
        <RdoDialog
          obraId={dummyObraId}
          date={new Date()}
          trigger={
            <Button size="lg" className="w-full bg-primary hover:bg-primary/90 py-6 text-lg font-bold shadow-md">
              <Plus className="mr-3 h-6 w-6" /> NOVO RDO
            </Button>
          }
        />

        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
           <Card className="p-4 border-l-4 border-l-blue-500 shadow-sm">
             <CardTitle className="text-xs text-muted-foreground uppercase font-semibold">RDOs Hoje</CardTitle>
             <div className="text-2xl font-bold mt-1">{rdoMetrics?.rdosTodayCount ?? 0}</div>
           </Card>
           <Card className="p-4 border-l-4 border-l-green-500 shadow-sm">
             <CardTitle className="text-xs text-muted-foreground uppercase font-semibold">Mão de Obra</CardTitle>
             <div className="text-2xl font-bold mt-1">{rdoMetrics?.totalManpowerToday ?? 0}</div>
           </Card>
           <Card className="p-4 border-l-4 border-l-yellow-500 shadow-sm">
             <CardTitle className="text-xs text-muted-foreground uppercase font-semibold">Pendentes</CardTitle>
             <div className="text-2xl font-bold mt-1">{rdoMetrics?.pendingRdosCount ?? 0}</div>
           </Card>
           <Card className="p-4 border-l-4 border-l-red-500 shadow-sm">
             <CardTitle className="text-xs text-muted-foreground uppercase font-semibold">Ocorrências</CardTitle>
             <div className="text-2xl font-bold mt-1">{rdoMetrics?.openOccurrencesCount ?? 0}</div>
           </Card>
        </div>

        <Card className="shadow-sm">
          <CardHeader className="border-b bg-muted/20">
            <CardTitle className="text-xl">Diários Recentes</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
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