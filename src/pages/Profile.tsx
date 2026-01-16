import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import ProfileForm from "@/components/profile/ProfileForm";
import { useProfile } from "@/hooks/use-profile";
import { Loader2, UserCircle, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

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

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold">Meu Perfil</h1>
          <p className="text-muted-foreground">Gerencie suas informações pessoais e de conta.</p>
        </div>
        
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
      </div>
    </DashboardLayout>
  );
};

export default Profile;