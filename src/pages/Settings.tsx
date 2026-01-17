import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import KmCostForm from "@/components/settings/KmCostForm";
import CargosList from "@/components/settings/CargosList";
import SubscriptionTab from "@/components/settings/SubscriptionTab";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Route, Users, CreditCard } from "lucide-react";

const Settings = () => {
  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold">Configurações</h1>
          <p className="text-muted-foreground">Gerencie as configurações de referência para cálculos de custo e sua conta.</p>
        </div>
        
        <Tabs defaultValue="cargos" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="cargos" className="flex items-center"><Users className="w-4 h-4 mr-2" /> Cargos e Salários</TabsTrigger>
            <TabsTrigger value="custos" className="flex items-center"><Route className="w-4 h-4 mr-2" /> Custos de Deslocamento</TabsTrigger>
            <TabsTrigger value="plano" className="flex items-center text-primary"><CreditCard className="w-4 h-4 mr-2" /> Plano e Assinatura</TabsTrigger>
          </TabsList>

          <TabsContent value="cargos">
            <Card>
              <CardHeader>
                <CardTitle>Cadastro de Cargos</CardTitle>
                <CardDescription>Defina o custo diário médio por cargo para cálculos automáticos no RDO.</CardDescription>
              </CardHeader>
              <CardContent>
                <CargosList />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="custos">
            <Card>
              <CardHeader>
                <CardTitle>Custo de Deslocamento</CardTitle>
                <CardDescription>Valor usado para o cálculo de KM rodado nos relatórios de atividade.</CardDescription>
              </CardHeader>
              <CardContent>
                <KmCostForm />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="plano">
            <SubscriptionTab />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Settings;