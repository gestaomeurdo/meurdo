import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import CargosList from "@/components/settings/CargosList";
import SubscriptionTab from "@/components/settings/SubscriptionTab";
import ProfileForm from "@/components/profile/ProfileForm";
import UserLogoUpload from "@/components/profile/UserLogoUpload";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, Users, CreditCard, ShieldCheck } from "lucide-react";
import { useProfile } from "@/hooks/use-profile";
import { Loader2 } from "lucide-react";

const Settings = () => {
  const { data: profile, isLoading } = useProfile();

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-[60vh]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 space-y-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-black uppercase tracking-tighter">Central de Comando</h1>
          <p className="text-sm text-muted-foreground font-medium">Configurações de identidade, equipe e assinatura.</p>
        </div>

        <Tabs defaultValue="empresa" className="w-full">
          <TabsList className="grid w-full grid-cols-3 h-14 bg-muted/50 p-1 rounded-2xl mb-8">
            <TabsTrigger value="empresa" className="rounded-xl data-[state=active]:bg-[#066abc] data-[state=active]:text-white font-bold">
              <Building2 className="w-4 h-4 mr-2 hidden sm:inline" /> Perfil e Empresa
            </TabsTrigger>
            <TabsTrigger value="custos" className="rounded-xl data-[state=active]:bg-[#066abc] data-[state=active]:text-white font-bold">
              <Users className="w-4 h-4 mr-2 hidden sm:inline" /> Cargos e Custos
            </TabsTrigger>
            <TabsTrigger value="plano" className="rounded-xl data-[state=active]:bg-[#066abc] data-[state=active]:text-white font-bold">
              <CreditCard className="w-4 h-4 mr-2 hidden sm:inline" /> Plano e Assinatura
            </TabsTrigger>
          </TabsList>

          <TabsContent value="empresa" className="space-y-6 animate-in fade-in duration-500">
            <UserLogoUpload />
            <Card className="shadow-clean border-none rounded-3xl overflow-hidden">
              <CardHeader className="bg-muted/30">
                <CardTitle className="text-xl font-bold">Informações do Negócio</CardTitle>
                <CardDescription>Estes dados serão utilizados para personalizar seus PDFs e comunicações.</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                {profile && <ProfileForm initialData={profile} />}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="custos" className="animate-in fade-in duration-500">
            <Card className="shadow-clean border-none rounded-3xl overflow-hidden">
              <CardHeader className="bg-muted/30 pb-6">
                <CardTitle className="flex items-center gap-2 text-xl font-bold text-[#066abc]">
                  <Users className="w-6 h-6" /> Banco de Cargos e Salários
                </CardTitle>
                <CardDescription>Defina os custos unitários. O sistema utilizará esses valores para calcular o gasto total da obra via RDO.</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <CargosList />
              </CardContent>
            </TabsContent>

          <TabsContent value="plano" className="animate-in fade-in duration-500">
            <SubscriptionTab />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Settings;