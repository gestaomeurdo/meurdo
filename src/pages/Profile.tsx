import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import ProfileForm from "@/components/profile/ProfileForm";
import { useProfile } from "@/hooks/use-profile";
import { Loader2, UserCircle, AlertTriangle, CreditCard, Construction, Infinity } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import SubscriptionInfo from "@/components/profile/SubscriptionInfo";
import { Badge } from "@/components/ui/badge";
import UpgradeButton from "@/components/subscription/UpgradeButton";
import { useCanCreateObra } from "@/hooks/use-subscription-limits";
import ProFeaturesCard from "@/components/profile/ProFeaturesCard";

const Profile = () => {
  const { data: profile, isLoading } = useProfile();
  const { obraCount, isPro, isLoading: isLoadingLimits } = useCanCreateObra();

  if (isLoading || isLoadingLimits) {
    return (
      <DashboardLayout>
        <div className="p-6 flex justify-center items-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Carregando perfil...</span>
        </div>
      </DashboardLayout>
    );
  }

  if (!profile) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Erro ao carregar perfil</AlertTitle>
            <AlertDescription>Não foi possível encontrar os dados do seu perfil. Tente recarregar a página.</AlertDescription>
          </Alert>
        </div>
      </DashboardLayout>
    );
  }
  
  const isProActive = profile.subscription_status === 'active';
  const planType = profile.plan_type || 'free';
  const firstName = profile.first_name || "Usuário";

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">Olá, {firstName}</h1>
            <Badge variant={isProActive ? "default" : "outline"} className={isProActive ? "bg-primary hover:bg-primary/90 text-primary-foreground" : "text-orange-600 border-orange-200 bg-orange-50"}>
              Plano {planType.toUpperCase()}
            </Badge>
          </div>
          <p className="text-muted-foreground">Gerencie suas informações pessoais e de conta.</p>
        </div>
        
        {!isProActive && (
          <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <p className="font-semibold text-yellow-800 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              Você está no plano limitado. Mude para o PRO para obras ilimitadas!
            </p>
            <div className="w-full sm:w-auto">
              <UpgradeButton />
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Coluna Principal (Informações e Assinatura) */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCircle className="w-5 h-5" />
                  Informações Pessoais
                </CardTitle>
                <CardDescription>
                  Atualize seu nome e sobrenome.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ProfileForm initialData={profile} />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Assinatura e Plano
                </CardTitle>
                <CardDescription>
                  Detalhes do seu plano de acesso.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SubscriptionInfo />
              </CardContent>
            </Card>
          </div>

          {/* Coluna Lateral (Estatísticas e Benefícios PRO) */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium uppercase text-muted-foreground">Obras Criadas</CardTitle>
                <Construction className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="pt-2">
                <div className="text-3xl font-bold">{obraCount}</div>
                <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                  Limite do Plano: {isProActive ? <Infinity className="w-4 h-4" /> : '1 Obra'}
                </p>
              </CardContent>
            </Card>
            
            {isProActive && <ProFeaturesCard />}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Profile;