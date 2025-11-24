import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import KmCostForm from "@/components/settings/KmCostForm";

const Settings = () => {
  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <h1 className="text-3xl font-bold mb-6">Configurações e Usuários</h1>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Custo de Deslocamento</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Defina o valor em Reais (R$) que será usado para calcular o custo total do KM rodado nas atividades.
            </p>
            <KmCostForm />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Gerenciamento de Usuários</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Gerenciamento de perfis e permissões de acesso (Funcionalidade futura).
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Settings;