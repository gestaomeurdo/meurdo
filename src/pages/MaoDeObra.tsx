import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import CargosList from "@/components/settings/CargosList";
import { Users, Info } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const MaoDeObra = () => {
  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold">Gestão de Mão de Obra</h1>
          <p className="text-muted-foreground">Cadastre as funções e custos diários da sua equipe.</p>
        </div>

        <Alert className="bg-primary/10 border-primary/20">
          <Info className="h-4 w-4 text-primary" />
          <AlertTitle className="text-primary font-bold">Dica de Produtividade</AlertTitle>
          <AlertDescription>
            Os cargos cadastrados aqui aparecerão automaticamente como sugestão no preenchimento do **RDO (Relatório Diário de Obra)**, facilitando o cálculo de custo diário.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Banco de Cargos e Salários
            </CardTitle>
            <CardDescription>
              Gerencie pedreiros, serventes, empreiteiros e outros profissionais.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CargosList />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default MaoDeObra;