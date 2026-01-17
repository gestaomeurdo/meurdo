import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/integrations/supabase/auth-provider";
import { Loader2, Plus, CheckCircle, AlertTriangle, Zap } from "lucide-react";
import { useRdoDashboardMetrics } from "@/hooks/use-rdo-dashboard-metrics";
import RecentRdoList from "@/components/dashboard/RecentRdoList";
import RdoDialog from "@/components/rdo/RdoDialog";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useCanCreateObra } from "@/hooks/use-subscription-limits";
import LimitReachedModal from "@/components/subscription/LimitReachedModal";
import WelcomeFreeModal from "@/components/subscription/WelcomeFreeModal";
import { cn } from "@/lib/utils";

const Dashboard = () => {
  const { user, isLoading: authLoading, profile, isPro } = useAuth();
  const { data: rdoMetrics, isLoading: isLoadingRdoMetrics } = useRdoDashboardMetrics();
  const { canCreate, isLoading: isLoadingLimits, obraCount } = useCanCreateObra();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [showWelcomePro, setShowWelcomePro] = useState(false);
  const [limitModalOpen, setLimitModalOpen] = useState(false);

  useEffect(() => {
    // Force profile revalidation every time the Dashboard component mounts
    queryClient.invalidateQueries({ queryKey: ['profile'] });

    const params = new URLSearchParams(location.search);
    const sessionId = params.get('session_id');
    if (sessionId) {
      window.history.replaceState({}, document.title, location.pathname);
      // The profile invalidation above should handle the status update
      // We can still show a welcome message for PRO users if needed
      setShowWelcomePro(true);
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

  return (
    <DashboardLayout>
      {!isPro && <WelcomeFreeModal />}
      <div className="p-4 sm:p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground truncate">
              Olá, {firstName}!
            </h1>
            <p className="text-sm text-muted-foreground font-medium">Resumo operacional da sua construtora.</p>
          </div>
          {!isPro && (
            <div className="hidden sm:flex items-center gap-2 bg-orange-500/10 px-3 py-1.5 rounded-full border border-orange-500/20">
                <Zap className="w-3 h-3 text-orange-600 fill-current" />
                <span className="text-[10px] font-black text-orange-700 uppercase tracking-widest">Plano Free</span>
            </div>
          )}
        </div>

        {showWelcomePro && (
          <Alert className="bg-green-500/10 border-green-500/30 text-green-800 rounded-2xl">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-700 font-bold">Bem-vindo ao PRO!</AlertTitle>
            <AlertDescription>Sua assinatura foi ativada. Você agora tem acesso ilimitado.</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 gap-4">
          {canCreate ? (
            <RdoDialog
              obraId={dummyObraId}
              date={new Date()}
              trigger={
                <Button size="lg" className="w-full bg-[#066abc] hover:bg-[#066abc]/90 py-8 text-lg font-black uppercase tracking-wider shadow-xl rounded-2xl">
                  <Plus className="mr-3 h-6 w-6" /> Lançar RDO Hoje
                </Button>
              }
            />
          ) : (
            <Button size="lg" className="w-full bg-orange-500 hover:bg-orange-600 py-8 text-lg font-black uppercase tracking-wider shadow-xl rounded-2xl" onClick={() => setLimitModalOpen(true)}>
              <Zap className="mr-3 h-6 w-6 fill-current" /> Liberar RDOs Ilimitados
            </Button>
          )}
        </div>

        <LimitReachedModal open={limitModalOpen} onOpenChange={setLimitModalOpen} />

        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          {[
            { label: "RDOs Hoje", value: rdoMetrics?.rdosTodayCount, color: "bg-blue-500" },
            { label: "Mão de Obra", value: rdoMetrics?.totalManpowerToday, color: "bg-green-500" },
            { label: "Pendentes", value: rdoMetrics?.pendingRdosCount, color: "bg-orange-500" },
            { label: "Ocorrências", value: rdoMetrics?.openOccurrencesCount, color: "bg-red-500" },
          ].map((stat, i) => (
            <Card key={i} className="shadow-sm border-none bg-card overflow-hidden">
                <div className={cn("h-1 w-full", stat.color)}></div>
                <CardContent className="p-4">
                    <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">{stat.label}</p>
                    <div className="text-2xl font-black mt-1">{stat.value ?? 0}</div>
                </CardContent>
            </Card>
          ))}
        </div>

        <Card className="shadow-clean border-none rounded-3xl overflow-hidden">
          <CardHeader className="border-b bg-muted/30">
            <CardTitle className="text-xl font-bold">Diários de Obra Recentes</CardTitle>
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