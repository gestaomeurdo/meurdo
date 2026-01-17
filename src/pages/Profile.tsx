import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import ProfileForm from "@/components/profile/ProfileForm";
import { useProfile } from "@/hooks/use-profile";
import { Loader2, UserCircle, AlertTriangle, CreditCard, Construction, Infinity, ShieldCheck } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import SubscriptionInfo from "@/components/profile/SubscriptionInfo";
import { Badge } from "@/components/ui/badge";
import UpgradeButton from "@/components/subscription/UpgradeButton";
import { useCanCreateObra } from "@/hooks/use-subscription-limits";
import ProFeaturesCard from "@/components/profile/ProFeaturesCard";
import UserLogoUpload from "@/components/profile/UserLogoUpload";

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

  if (!profile) return null;
  
  const isProActive = profile.subscription_status === 'active';
  const planType = profile.plan_type || 'free';
  const firstName = profile.first_name || "Usuário";

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 space-y-6">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">Olá, {firstName}</h1>
            <Badge variant={isProActive ? "default" : "outline"} className={isProActive ? "bg-primary text-white" : ""}>
              Plano {planType.toUpperCase()}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">Gerencie sua conta e identidade visual.</p>
        </div>
        
        {!isProActive && (
          <Alert className="bg-primary/5 border-primary/20">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <AlertTitle className="text-primary font-bold">Upgrade para PRO</AlertTitle>
            <AlertDescription className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mt-2">
              <span>Sua marca em todos os relatórios e obras ilimitadas.</span>
              <UpgradeButton />
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <UserLogoUpload />
            
            <Card className="shadow-clean">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCircle className="w-5 h-5 text-primary" />
                  Informações Pessoais
                </CardTitle>
                <CardDescription>Dados de identificação no sistema.</CardDescription>
              </CardHeader>
              <CardContent>
                <ProfileForm initialData={profile} />
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1 space-y-6">
            <Card className="shadow-clean overflow-hidden">
               <div className="h-2 bg-primary w-full"></div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-bold uppercase text-muted-foreground tracking-widest">Atividade</CardTitle>
                <Construction className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent className="pt-2">
                <div className="text-4xl font-black text-primary">{obraCount}</div>
                <p className="text-xs text-muted-foreground mt-2 font-medium">Obras gerenciadas</p>
              </CardContent>
            </Card>
            
            <SubscriptionInfo />
            
            {isProActive && <ProFeaturesCard />}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Profile;