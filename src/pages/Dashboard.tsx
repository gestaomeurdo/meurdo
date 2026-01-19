import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/integrations/supabase/auth-provider";
import { Loader2, CheckCircle, Zap, MapPin, Calendar, ArrowRight, ImageIcon, HardHat, Truck, FileStack, Building2, TrendingUp, AlertCircle } from "lucide-react";
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
import { useRdoAlerts } from "@/hooks/use-rdo-alerts";
import RdoDialog from "@/components/rdo/RdoDialog";

const Dashboard = () => {
  const { user, isLoading: authLoading, profile, isPro } = useAuth();
  const { data: rdoMetrics } = useRdoDashboardMetrics();
  const { data: alerts } = useRdoAlerts();
  const { data: obras, isLoading: isLoadingObras } = useObras();
  const { data: progressMap, isLoading: isLoadingProgress } = useObrasProgress();
  
  const location = useLocation();
  const queryClient = useQueryClient();
  const [showWelcomePro, setShowWelcomePro] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const sessionId = params.get('session_id');
    if (sessionId) {
      window.history.replaceState({}, document.title, location.pathname);
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      setShowWelcomePro(true);
    }
  }, [location.search, queryClient]);

  if (authLoading || isLoadingObras || isLoadingProgress) {
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
        </div>

        {/* ALERTAS DE CORREÇÃO (NOVO) */}
        {alerts && alerts.length > 0 && (
          <div className="space-y-3 animate-in slide-in-from-top-4 duration-500">
            <h3 className="text-xs font-black text-red-600 uppercase tracking-widest flex items-center gap-2">
              <AlertCircle className="w-4 h-4" /> Atenção Necessária
            </h3>
            {alerts.map(alert => (
              <Alert key={alert.id} variant="destructive" className="bg-red-50 border-red-200 shadow-sm rounded-2xl p-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 w-full">
                  <div className="flex items-start gap-3">
                    <div className="bg-red-100 p-2 rounded-xl mt-1">
                      <FileStack className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <AlertTitle className="text-red-900 font-bold uppercase text-xs">Ajuste solicitado pelo cliente</AlertTitle>
                      <AlertDescription className="text-red-700 text-sm font-medium mt-1">
                        Obra: <span className="font-bold">{alert.obra_nome}</span> • Data: <span className="font-bold">{formatDate(alert.data_rdo)}</span>
                        <p className="mt-1 italic text-xs opacity-80">"{alert.rejection_reason}"</p>
                      </AlertDescription>
                    </div>
                  </div>
                  <RdoDialog 
                    obraId={alert.obra_id} 
                    date={new Date(alert.data_rdo + 'T12:00:00')} 
                    trigger={
                      <Button className="bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold h-10 px-6">
                        Corrigir Agora
                      </Button>
                    }
                  />
                </div>
              </Alert>
            ))}
          </div>
        )}

        {showWelcomePro && (
          <Alert className="bg-green-500/10 border-green-500/30 text-green-800 rounded-2xl">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-700 font-bold">Bem-vindo ao PRO!</AlertTitle>
            <AlertDescription>Sua assinatura foi ativada. Você agora tem acesso ilimitado.</AlertDescription>
          </Alert>
        )}

        {/* Big Stats Cards */}
        <div className="grid gap-6 grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Total de Obras", value: obras?.length || 0, icon: Building2, color: "bg-blue-500", textColor: "text-blue-600", bgColor: "bg-blue-50" },
            { label: "Total de RDOs", value: rdoMetrics?.totalRdosCount ?? 0, icon: FileStack, color: "bg-purple-500", textColor: "text-purple-600", bgColor: "bg-purple-50" },
            { label: "Efetivo Acumulado", value: rdoMetrics?.totalManpowerAccumulated ?? 0, icon: HardHat, color: "bg-green-500", textColor: "text-green-600", bgColor: "bg-green-50" },
            { label: "Máquinas Acumulado", value: rdoMetrics?.totalEquipmentAccumulated ?? 0, icon: Truck, color: "bg-orange-500", textColor: "text-orange-600", bgColor: "bg-orange-50" },
          ].map((stat, i) => (
            <Card key={i} className="shadow-md border-none bg-card overflow-hidden hover:shadow-lg transition-all rounded-3xl">
                <div className={cn("h-2 w-full", stat.color)}></div>
                <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                        <div className={cn("p-3 rounded-2xl", stat.bgColor)}>
                            <stat.icon className={cn("w-6 h-6", stat.textColor)} />
                        </div>
                    </div>
                    <div className="text-4xl font-black tracking-tight">{stat.value}</div>
                    <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mt-2">{stat.label}</p>
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
                                <Card className="shadow-sm hover:shadow-xl transition-all cursor-pointer border-none overflow-hidden group h-full flex flex-col rounded-[2rem] ring-1 ring-border/50">
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