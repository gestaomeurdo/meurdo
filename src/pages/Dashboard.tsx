import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/integrations/supabase/auth-provider";
import { useProfile } from "@/hooks/use-profile";
import { Loader2, Construction, DollarSign, AlertTriangle, Clock, FileText, Users, Plus } from "lucide-react";
import { useRdoDashboardMetrics } from "@/hooks/use-rdo-dashboard-metrics";
import RecentRdoList from "@/components/dashboard/RecentRdoList";
import RdoDialog from "@/components/rdo/RdoDialog";
import { Button } from "@/components/ui/button";

const Dashboard = () => {
  const { user, isLoading: authLoading, error: authError, profile } = useAuth();
  const { data: rdoMetrics, isLoading: isLoadingRdoMetrics } = useRdoDashboardMetrics();
  
  // DEBUG VISUAL DE ESTADO
  console.log("[DEBUG Dashboard] Renderizando. AuthLoading:", authLoading, "Profile:", profile);

  if (authLoading) {
    return (
      <div className="p-10 text-center font-mono">
        <Loader2 className="animate-spin inline mr-2" />
        DEBUG: Carregando AUTH/PROFILE... (Ver console)
      </div>
    );
  }

  if (authError) {
    return (
      <div className="p-10 bg-red-100 text-red-800 border-2 border-red-500 rounded-lg">
        <h2 className="font-bold">ERRO DE AUTENTICAÇÃO BLOQUEANTE:</h2>
        <pre className="mt-2 text-xs">{JSON.stringify(authError, null, 2)}</pre>
        <Button onClick={() => window.location.reload()} className="mt-4">Tentar Recarregar</Button>
      </div>
    );
  }

  const firstName = profile?.first_name || user?.email?.split('@')[0] || "Usuário";
  const dummyObraId = '00000000-0000-0000-0000-000000000000';

  return (
    <DashboardLayout>
      {/* BLOCO DE DEBUG NO TOPO */}
      <div className="bg-yellow-100 p-4 m-4 border-2 border-yellow-400 rounded-lg text-xs font-mono text-black space-y-1">
        <div className="font-bold border-b border-yellow-400 pb-1 mb-1">DADOS DE DEBUG (CRUS):</div>
        <div><strong>STATUS ASSINATURA:</strong> {JSON.stringify(profile?.subscription_status)}</div>
        <div><strong>PLAN TYPE:</strong> {JSON.stringify(profile?.plan_type)}</div>
        <div><strong>USER ID:</strong> {user?.id}</div>
        <details>
            <summary className="cursor-pointer font-bold">VER PROFILE COMPLETO</summary>
            <pre className="mt-2 bg-white/50 p-2 rounded">{JSON.stringify(profile, null, 2)}</pre>
        </details>
      </div>

      <div className="p-4 sm:p-6 space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground truncate">Bem-vindo(a), {firstName}!</h1>
        </div>
        
        <RdoDialog
          obraId={dummyObraId}
          date={new Date()}
          trigger={
            <Button size="lg" className="w-full bg-primary py-6"><Plus className="mr-3" /> NOVO RDO</Button>
          }
        />

        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
           {/* Removendo condicionais complexas para o Dashboard renderizar de qualquer forma */}
           <Card className="p-4 border-l-4 border-l-blue-500">
             <CardTitle className="text-xs text-muted-foreground uppercase">RDOs Hoje</CardTitle>
             <div className="text-2xl font-bold">{rdoMetrics?.rdosTodayCount ?? 0}</div>
           </Card>
           <Card className="p-4 border-l-4 border-l-green-500">
             <CardTitle className="text-xs text-muted-foreground uppercase">Mão de Obra</CardTitle>
             <div className="text-2xl font-bold">{rdoMetrics?.totalManpowerToday ?? 0}</div>
           </Card>
           <Card className="p-4 border-l-4 border-l-yellow-500">
             <CardTitle className="text-xs text-muted-foreground uppercase">Pendentes</CardTitle>
             <div className="text-2xl font-bold">{rdoMetrics?.pendingRdosCount ?? 0}</div>
           </Card>
           <Card className="p-4 border-l-4 border-l-red-500">
             <CardTitle className="text-xs text-muted-foreground uppercase">Ocorrências</CardTitle>
             <div className="text-2xl font-bold">{rdoMetrics?.openOccurrencesCount ?? 0}</div>
           </Card>
        </div>

        <Card>
          <CardHeader><CardTitle className="text-xl">Diários Recentes</CardTitle></CardHeader>
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