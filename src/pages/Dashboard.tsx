import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/integrations/supabase/auth-provider";
import { Loader2, CheckCircle, Zap, MapPin, Calendar, ArrowRight, ImageIcon, HardHat, Truck, FileStack, Building2, TrendingUp } from "lucide-react";
import { useRdoDashboardMetrics } from "@/hooks/use-rdo-dashboard-metrics";
import { useEffect, useState } from "react";
import { useLocation, Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useCanCreateObra } from "@/hooks/use-subscription-limits";
import LimitReachedModal from "@/components/subscription/LimitReachedModal";
import WelcomeFreeModal from "@/components/subscription/WelcomeFreeModal";
import { cn } from "@/lib/utils";
import { useObras, useObrasProgress } from "@/hooks/use-obras";
import { formatDate } from "@/utils/formatters";
import { useRdoLimits } from "@/hooks/use-rdo-limits";
import { Progress } from "@/components/ui/progress";

const Dashboard = () => {
  const { user, isLoading: authLoading, profile, isPro } = useAuth();
  const { data: rdoMetrics } = useRdoDashboardMetrics();
  const { isLoading: isLoadingLimits } = useCanCreateObra();
  const { data: obras, isLoading: isLoadingObras } = useObras();
  const { isLoading: isLoadingRdoCount } = useRdoLimits();
  const { data: progressMap, isLoading: isLoadingProgress } = useObrasProgress();
  
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

  if (authLoading || isLoadingLimits || isLoadingObras || isLoadingRdoCount || isLoadingProgress) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const firstName = profile?.first_name || user?.email?.split('@')[0] || "Usuário";

  return (
    <DashboardLayout>
      {!isPro && <WelcomeFreeModal />}
      <div className="p-4 sm:p-6 space-y-8">
        <div className="flex justify-between items-center">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground truncate">
              Olá, {firstName}!
            </h1>
            <p className="text-sm text-muted-foreground font-medium">Visão geral do seu portfólio de obras.</p>
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

        {/* Big Stats Cards */}
        <div className="grid gap-6 grid-cols-2 lg:grid-cols-4">
          {[
            { 
              label: "Total de Obras", 
              value: obras?.length || 0, 
              icon: Building2, 
              color: "bg-blue-500", 
              textColor: "text-blue-600",
              bgColor: "bg-blue-50"
            },
            { 
              label: "Total de RDOs", 
              value: rdoMetrics?.totalRdosCount ?? 0, 
              icon: FileStack, 
              color: "bg-purple-500",
              textColor: "text-purple-600",
              bgColor: "bg-purple-50"
            },
            { 
              label: "Efetivo Acumulado", 
              value: rdoMetrics?.totalManpowerAccumulated ?? 0, 
              icon: HardHat, 
              color: "bg-green-500",
              textColor: "text-green-600",
              bgColor: "bg-green-50"
            },
            { 
              label: "Máquinas Acumulado", 
              value: rdoMetrics?.totalEquipmentAccumulated ?? 0, 
              icon: Truck, 
              color: "bg-orange-500",
              textColor: "text-orange-600",
              bgColor: "bg-orange-50"
            },
          ].map((stat, i) => (
            <Card key={i} className="shadow-md border-none bg-card overflow-hidden hover:shadow-lg transition-all">
                <div className={cn("h-2 w-full", stat.color)}></div>
                <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                        <div className={cn("p-3 rounded-2xl", stat.bgColor)}>
                            <stat.icon className={cn("w-6 h-6", stat.textColor)} />
                        </div>
                    </div>
                    <div className="text-4xl font-black tracking-tight">{stat.value}</div>
                    <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mt-2">{stat.label}</p>
                </CardContent>
            </Card>
          ))}
        </div>

        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold tracking-tight">Meus Projetos</h2>
                <Link to="/obras" className="text-sm text-primary font-bold hover:underline flex items-center bg-primary/10 px-4 py-2 rounded-xl">
                    Ver Todas <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
            </div>
            
            {obras && obras.length > 0 ? (
                <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                    {obras.slice(0, 6).map((obra) => {
                        const progress = progressMap?.[obra.id] || 0;
                        
                        return (
                            <Link to={`/obras/${obra.id}`} key={obra.id}>
                                <Card className="shadow-sm hover:shadow-xl transition-all cursor-pointer border-none overflow-hidden group h-full flex flex-col rounded-3xl ring-1 ring-border/50">
                                    <div className="h-32 w-full bg-muted relative overflow-hidden">
                                        {obra.foto_url ? (
                                            <img src={obra.foto_url} alt={obra.nome} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-accent/30">
                                                <ImageIcon className="w-8 h-8 text-muted-foreground/30" />
                                            </div>
                                        )}
                                        <div className="absolute top-3 right-3">
                                            {obra.status === 'ativa' && <div className="px-3 py-1 rounded-full bg-green-500/90 backdrop-blur-sm text-white text-[10px] font-black uppercase tracking-wider shadow-lg">Ativa</div>}
                                            {obra.status === 'pausada' && <div className="px-3 py-1 rounded-full bg-yellow-500/90 backdrop-blur-sm text-white text-[10px] font-black uppercase tracking-wider shadow-lg">Pausada</div>}
                                            {obra.status === 'concluida' && <div className="px-3 py-1 rounded-full bg-blue-500/90 backdrop-blur-sm text-white text-[10px] font-black uppercase tracking-wider shadow-lg">Concluída</div>}
                                        </div>
                                        <div className="absolute bottom-0 left-0 w-full h-20 bg-gradient-to-t from-black/80 to-transparent"></div>
                                        <div className="absolute bottom-3 left-4 right-4">
                                            <h3 className="font-bold text-xl text-white truncate shadow-black drop-shadow-md">{obra.nome}</h3>
                                            <div className="flex items-center text-xs text-white/80 mt-0.5 truncate">
                                                <MapPin className="w-3.5 h-3.5 mr-1 shrink-0" />
                                                <span className="truncate">{obra.endereco || "Local não informado"}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <CardContent className="p-5 flex-1 flex flex-col gap-4 bg-card">
                                        <div className="space-y-1">
                                            <div className="flex justify-between items-end">
                                                <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                                                    <TrendingUp className="w-3 h-3" /> Progresso Físico Real
                                                </span>
                                                <span className="text-xs font-black text-primary">{progress}%</span>
                                            </div>
                                            <Progress value={progress} className="h-1.5" />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border/50">
                                            <div className="space-y-1">
                                                <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" /> Início
                                                </span>
                                                <p className="text-sm font-semibold">{formatDate(obra.data_inicio)}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" /> Previsão
                                                </span>
                                                <p className="text-sm font-semibold">{obra.previsao_entrega ? formatDate(obra.previsao_entrega) : 'Indefinido'}</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        );
                    })}
                </div>
            ) : (
                <div className="text-center py-16 border-2 border-dashed rounded-3xl bg-muted/20">
                    <Building2 className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
                    <p className="text-muted-foreground text-lg font-medium">Nenhuma obra cadastrada.</p>
                    <p className="text-sm text-muted-foreground/70 mb-6">Comece criando seu primeiro projeto para gerenciar.</p>
                    <Link to="/obras">
                        <span className="bg-primary text-white px-6 py-3 rounded-xl font-bold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20">
                            Cadastrar Primeira Obra
                        </span>
                    </Link>
                </div>
            )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;