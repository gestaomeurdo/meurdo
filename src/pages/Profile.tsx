import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import ProfileForm from "@/components/profile/ProfileForm";
import { useProfile } from "@/hooks/use-profile";
import { Loader2, UserCircle, AlertTriangle, CreditCard } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import SubscriptionInfo from "@/components/profile/SubscriptionInfo";
import { Badge } from "@/components/ui/badge";
import UpgradeButton from "@/components/subscription/UpgradeButton";

const Profile = () => {
  const { data: profile, isLoading } = useProfile();

  if (isLoading) {
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
  
  const isPro = profile.subscription_status === 'active';
  const planType = profile.plan_type || 'free';
  const firstName = profile.first_name || "Usuário";

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">Olá, {firstName}</h1>
            <Badge variant={isPro ? "default" : "outline"} className={isPro ? "bg-primary hover:bg-primary/90 text-primary-foreground" : "text-orange-600 border-orange-200 bg-orange-50"}>
              Plano {planType.toUpperCase()}
            </Badge>
          </div>
          <p className="text-muted-foreground">Gerencie suas informações pessoais e de conta.</p>
        </div>
        
        {!isPro && (
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
    </DashboardLayout>
  );
};

export default Profile;