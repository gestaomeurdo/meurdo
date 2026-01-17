import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/integrations/supabase/auth-provider";
import { Loader2, CheckCircle, Zap, MapPin, Calendar, DollarSign, ArrowRight } from "lucide-react";
import { useRdoDashboardMetrics } from "@/hooks/use-rdo-dashboard-metrics";
import RecentRdoList from "@/components/dashboard/RecentRdoList";
import { useEffect, useState } from "react";
import { useLocation, Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useCanCreateObra } from "@/hooks/use-subscription-limits";
import LimitReachedModal from "@/components/subscription/LimitReachedModal";
import WelcomeFreeModal from "@/components/subscription/WelcomeFreeModal";
import { cn } from "@/lib/utils";
import { useObras } from "@/hooks/use-obras";
import { formatCurrency, formatDate } from "@/utils/formatters";

const Dashboard = () => {
  const { user, isLoading: authLoading, profile, isPro } = useAuth();
  const { data: rdoMetrics, isLoading: isLoadingRdoMetrics } = useRdoDashboardMetrics();
  const { isLoading: isLoadingLimits } = useCanCreateObra();
  const { data: obras, isLoading: isLoadingObras } = useObras();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [showWelcomePro, setShowWelcomePro] = useState(false);
  const [limitModalOpen, setLimitModalOpen] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const sessionId = params.get('session_id');
    if (sessionId) {
      window.history.replaceState({}, document.title, location.pathname);
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      setShowWelcomePro(true);
      const timer = setTimeout(() => setShowWelcomePro(false), 8000);
      return () => clearTimeout(timer);
    }
  }, [location.search, queryClient]);

  if (authLoading || isLoadingLimits || isLoadingObras) {
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
      <div className="p-4 sm:p-6 space-y-8">
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

        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold tracking-tight">Minhas Obras</h2>
                <Link to="/obras" className="text-sm text-primary font-medium hover:underline flex items-center">
                    Gerenciar Obras <ArrowRight className="w-3 h-3 ml-1" />
                </Link>
            </div>
            
            {obras && obras.length > 0 ? (
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                    {obras.slice(0, 3).map((obra) => (
                        <Link to="/gestao-rdo" key={obra.id}>
                            <Card className="shadow-sm hover:shadow-md transition-all cursor-pointer border-l-4 border-l-primary group">
                                <CardContent className="p-4">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-bold text-lg truncate pr-2 group-hover:text-primary transition-colors">{obra.nome}</h3>
                                        {obra.status === 'ativa' && <div className="h-2 w-2 rounded-full bg-green-500 shrink-0 mt-1.5 shadow-sm" title="Ativa" />}
                                        {obra.status !== 'ativa' && <div className="h-2 w-2 rounded-full bg-muted-foreground shrink-0 mt-1.5" title={obra.status} />}
                                    </div>
                                    
                                    <div className="space-y-3">
                                        <div className="flex items-center text-xs text-muted-foreground">
                                            <MapPin className="w-3.5 h-3.5 mr-1.5 text-primary/70 shrink-0" />
                                            <span className="truncate">{obra.endereco || "Local não informado"}</span>
                                        </div>
                                        
                                        <div className="flex items-center justify-between pt-3 mt-1 border-t border-dashed">
                                            <div className="flex items-center text-xs font-medium text-muted-foreground">
                                                <Calendar className="w-3.5 h-3.5 mr-1.5" />
                                                {formatDate(obra.data_inicio)}
                                            </div>
                                            <div className="flex items-center text-xs font-bold text-foreground">
                                                <DollarSign className="w-3.5 h-3.5 mr-0.5 text-primary" />
                                                {formatCurrency(obra.orcamento_inicial)}
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            ) : (
                <div className="text-center py-10 border-2 border-dashed rounded-xl bg-muted/20">
                    <p className="text-muted-foreground text-sm font-medium">Nenhuma obra cadastrada.</p>
                    <Link to="/obras" className="text-primary font-bold text-sm mt-2 inline-block hover:underline">
                        Cadastrar Primeira Obra
                    </Link>
                </div>
            )}
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