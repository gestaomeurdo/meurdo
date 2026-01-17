import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/integrations/supabase/auth-provider";
import { Loader2, Plus, CheckCircle, AlertTriangle } from "lucide-react";
import { useRdoDashboardMetrics } from "@/hooks/use-rdo-dashboard-metrics";
import RecentRdoList from "@/components/dashboard/RecentRdoList";
import RdoDialog from "@/components/rdo/RdoDialog";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { showSuccess } from "@/utils/toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useCanCreateObra } from "@/hooks/use-subscription-limits";
import LimitReachedModal from "@/components/subscription/LimitReachedModal";

const Dashboard = () => {
  const { user, isLoading: authLoading, profile } = useAuth();
  const { data: rdoMetrics, isLoading: isLoadingRdoMetrics } = useRdoDashboardMetrics();
  const { canCreate, isLoading: isLoadingLimits, obraCount } = useCanCreateObra();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [showWelcomePro, setShowWelcomePro] = useState(false);
  const [limitModalOpen, setLimitModalOpen] = useState(false);

  // Efeito para verificar o retorno do Stripe e forçar a atualização do perfil
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const sessionId = params.get('session_id');

    if (sessionId) {
      // Limpa o parâmetro da URL
      window.history.replaceState({}, document.title, location.pathname);
      
      // Invalida a query do perfil para forçar o SessionContextProvider a buscar os dados atualizados
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      
      // Exibe a mensagem de boas-vindas
      setShowWelcomePro(true);
      
      // Opcional: Esconde a mensagem após alguns segundos
      const timer = setTimeout(() => setShowWelcomePro(false), 8000);
      return () => clearTimeout(timer);
    }
  }, [location.search, queryClient]);

  if (authLoading || isLoadingLimits) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const firstName = profile?.first_name || user?.email?.split('@')[0] || "Usuário";
  const dummyObraId = '00000000-0000-0000-0000-000000000000';
  
  const handleNewRdoClick = () => {
    if (!canCreate && obraCount >= 1) {
      setLimitModalOpen(true);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground truncate">Bem-vindo(a), {firstName}!</h1>
          <p className="text-muted-foreground">Aqui está o resumo da sua operação hoje.</p>
        </div>
        
        {showWelcomePro && (
          <Alert className="bg-green-500/10 border-green-500/30 text-green-800">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-700 font-bold">Bem-vindo ao PRO!</AlertTitle>
            <AlertDescription>
              Sua assinatura foi ativada com sucesso. Você agora tem acesso a obras ilimitadas e todos os recursos PRO.
            </AlertDescription>
          </Alert>
        )}
        
        {!canCreate && obraCount >= 1 && (
          <Alert variant="default" className="bg-yellow-500/10 border-yellow-500/30 text-yellow-800">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertTitle className="text-yellow-700 font-bold">Limite Atingido</AlertTitle>
            <AlertDescription>
              Você atingiu o limite de 1 obra no plano gratuito. Faça upgrade para continuar.
            </AlertDescription>
          </Alert>
        )}

        {canCreate ? (
          <RdoDialog
            obraId={dummyObraId}
            date={new Date()}
            trigger={
              <Button size="lg" className="w-full bg-primary hover:bg-primary/90 py-6 text-lg font-bold shadow-md">
                <Plus className="mr-3 h-6 w-6" /> NOVO RDO
              </Button>
            }
          />
        ) : (
          <Button 
            size="lg" 
            className="w-full bg-primary/50 cursor-not-allowed py-6 text-lg font-bold shadow-md"
            onClick={handleNewRdoClick}
          >
            <Plus className="mr-3 h-6 w-6" /> NOVO RDO (Limite Atingido)
          </Button>
        )}

        <LimitReachedModal open={limitModalOpen} onOpenChange={setLimitModalOpen} />

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