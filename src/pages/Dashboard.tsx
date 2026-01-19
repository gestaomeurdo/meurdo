import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/integrations/supabase/auth-provider";
import { Loader2, CheckCircle, Zap, MapPin, Calendar, ArrowRight, ImageIcon, HardHat, FileCheck, FileClock, FileEdit, Building2, TrendingUp } from "lucide-react";
import { useRdoDashboardMetrics } from "@/hooks/use-rdo-dashboard-metrics";
import { useEffect, useState } from "react";
import { useLocation, Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { useObras, useObrasProgress } from "@/hooks/use-obras";
import { formatDate } from "@/utils/formatters";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import WelcomeFreeModal from "@/components/subscription/WelcomeFreeModal";
import RdoActionCenter from "@/components/dashboard/RdoActionCenter";

const Dashboard = () => {
  const { user, isLoading: authLoading, profile, isPro } = useAuth();
  const { data: metrics, isLoading: metricsLoading } = useRdoDashboardMetrics();
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
      <div className="p-4 sm:p-6 space-y-10">
        <div className="flex justify-between items-center">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
              Olá, {firstName}!
            </h1>
            <p className="text-sm text-muted-foreground font-medium">Status operacional das suas obras.</p>
          </div>
          {isPro && (
             <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 py-1 px-3 rounded-full font-bold text-[10px] uppercase">
                Membro PRO Ativo
             </Badge>
          )}
        </div>

        {showWelcomePro && (
          <Alert className="bg-green-500/10 border-green-500/30 text-green-800 rounded-2xl animate-in slide-in-from-top-4">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-700 font-bold">Assinatura Ativada!</AlertTitle>
            <AlertDescription>Você agora tem acesso ilimitado e relatórios sem marca d'água.</AlertDescription>
          </Alert>
        )}

        {/* Status KPIs */}
        <div className="grid gap-6 grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Aprovações Pendentes", value: metrics?.pendingCount ?? 0, icon: FileClock, color: "bg-orange-500", textColor: "text-orange-600", bgColor: "bg-orange-50" },
            { label: "RDOs Aprovados", value: metrics?.approvedCount ?? 0, icon: FileCheck, color: "bg-emerald-500", textColor: "text-emerald-600", bgColor: "bg-emerald-50" },
            { label: "Rascunhos em Aberto", value: metrics?.draftCount ?? 0, icon: FileEdit, color: "bg-slate-400", textColor: "text-slate-500", bgColor: "bg-slate-100" },
            { label: "Efetivo Médio", value: metrics?.averageManpower ?? 0, icon: HardHat, color: "bg-blue-500", textColor: "text-blue-600", bgColor: "bg-blue-50" },
          ].map((stat, i) => (
            <Card key={i} className="shadow-md border-none bg-card overflow-hidden hover:shadow-lg transition-all rounded-3xl group">
                <div className={cn("h-1.5 w-full", stat.color)}></div>
                <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                        <div className={cn("p-3 rounded-2xl transition-transform group-hover:scale-110", stat.bgColor)}>
                            <stat.icon className={cn("w-6 h-6", stat.textColor)} />
                        </div>
                    </div>
                    <div className="text-4xl font-black tracking-tight">{stat.value}</div>
                    <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mt-2">{stat.label}</p>
                </CardContent>
            </Card>
          ))}
        </div>

        <RdoActionCenter 
          rdos={metrics?.actionRequiredRdos || []} 
          isLoading={metricsLoading} 
        />

        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold tracking-tight">Canteiro de Obras</h2>
                <Link to="/obras" className="text-xs text-primary font-black uppercase tracking-widest hover:underline flex items-center bg-primary/5 px-5 py-2.5 rounded-xl border border-primary/10">
                    Ver Portfólio <ArrowRight className="w-3.5 h-3.5 ml-2" />
                </Link>
            </div>
            
            {obras && obras.length > 0 ? (
                <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                    {obras.slice(0, 6).map((obra) => {
                        const progress = progressMap?.[obra.id] || 0;
                        return (
                            <Link to={`/obras/${obra.id}`} key={obra.id}>
                                <Card className="shadow-sm hover:shadow-xl transition-all cursor-pointer border-none overflow-hidden group h-full flex flex-col rounded-[2.5rem] ring-1 ring-border/50">
                                    <div className="h-32 w-full bg-muted relative overflow-hidden">
                                        {obra.foto_url ? (
                                            <img src={obra.foto_url} alt={obra.nome} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-accent/30">
                                                <ImageIcon className="w-8 h-8 text-muted-foreground/30" />
                                            </div>
                                        )}
                                        <div className="absolute top-4 right-4">
                                            <div className={cn(
                                                "px-3 py-1 rounded-full text-white text-[9px] font-black uppercase tracking-widest shadow-lg backdrop-blur-md",
                                                obra.status === 'ativa' ? "bg-emerald-500/90" : obra.status === 'pausada' ? "bg-orange-500/90" : "bg-blue-500/90"
                                            )}>
                                                {obra.status === 'ativa' ? 'Ativa' : obra.status === 'pausada' ? 'Pausada' : 'Concluída'}
                                            </div>
                                        </div>
                                        <div className="absolute bottom-0 left-0 w-full h-20 bg-gradient-to-t from-black/80 to-transparent"></div>
                                        <div className="absolute bottom-3 left-5 right-5">
                                            <h3 className="font-bold text-lg text-white truncate shadow-black drop-shadow-md uppercase tracking-tight">{obra.nome}</h3>
                                        </div>
                                    </div>
                                    <CardContent className="p-6 flex-1 flex flex-col gap-5 bg-card">
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-end">
                                                <span className="text-[10px] uppercase font-black text-slate-400 flex items-center gap-1">
                                                    <TrendingUp className="w-3 h-3" /> Progresso Físico
                                                </span>
                                                <span className="text-xs font-black text-primary">{progress}%</span>
                                            </div>
                                            <Progress value={progress} className="h-1.5" />
                                        </div>
                                        <div className="flex items-center text-[10px] text-muted-foreground font-bold uppercase truncate">
                                            <MapPin className="w-3 h-3 mr-1.5 text-primary shrink-0" />
                                            <span className="truncate">{obra.endereco || "Local não informado"}</span>
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        );
                    })}
                </div>
            ) : (
                <div className="text-center py-20 border-2 border-dashed rounded-[3rem] bg-muted/10">
                    <Building2 className="w-16 h-16 mx-auto text-muted-foreground/20 mb-4" />
                    <p className="text-muted-foreground text-lg font-bold">Nenhuma obra ativa.</p>
                    <Link to="/obras" className="mt-6 inline-block bg-primary text-white px-8 py-3.5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-blue-500/20">
                        Cadastrar Minha Obra
                    </Link>
                </div>
            )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;