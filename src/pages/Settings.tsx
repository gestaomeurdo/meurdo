import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import KmCostForm from "@/components/settings/KmCostForm";
import CargosList from "@/components/settings/CargosList";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShieldCheck, Route, Users } from "lucide-react";

const Settings = () => {
  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold">Painel Administrativo</h1>
          <p className="text-muted-foreground">Gerencie as configurações globais e o banco de dados de referência.</p>
        </div>
        
        <Tabs defaultValue="cargos" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="cargos" className="flex items-center"><Users className="w-4 h-4 mr-2" /> Cargos e Salários</TabsTrigger>
            <TabsTrigger value="geral" className="flex items-center"><Route className="w-4 h-4 mr-2" /> Custos de Deslocamento</TabsTrigger>
            <TabsTrigger value="acesso" className="flex items-center"><ShieldCheck className="w-4 h-4 mr-2" /> Controle de Acesso</TabsTrigger>
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

          <TabsContent value="geral">
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

          <TabsContent value="acesso">
            <Card>
              <CardHeader>
                <CardTitle>Usuários e Permissões</CardTitle>
                <CardDescription>Gerencie quem pode visualizar ou editar dados nas obras.</CardDescription>
              </CardHeader>
              <CardContent className="h-32 flex items-center justify-center border-dashed border-2 rounded-lg mt-4">
                <p className="text-muted-foreground italic">Módulo em desenvolvimento</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Settings;