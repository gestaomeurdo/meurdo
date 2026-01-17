import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import CargosList from "@/components/settings/CargosList";
import { Users, Info, Lightbulb } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const MaoDeObra = () => {
  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 space-y-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-black uppercase tracking-tight">Efetivo & Custos</h1>
          <p className="text-sm text-muted-foreground">Cadastre seu banco de funções para automatizar os relatórios.</p>
        </div>
        <Alert className="bg-[#066abc]/5 border-[#066abc]/20 rounded-2xl">
          <Lightbulb className="h-5 w-5 text-[#066abc]" />
          <AlertTitle className="text-[#066abc] font-black uppercase text-xs tracking-widest">Dica de Produtividade</AlertTitle>
          <AlertDescription className="text-sm">
            Cargos cadastrados aqui aparecem como sugestão no <strong>RDO</strong>. Ao selecionar uma função e a quantidade, 
            o sistema calcula o custo diário da obra automaticamente para você.
          </AlertDescription>
        </Alert>
        <Card className="shadow-clean border-none rounded-3xl overflow-hidden">
          <CardHeader className="bg-muted/30 pb-6">
            <CardTitle className="flex items-center gap-2 text-xl font-bold">
              <Users className="w-6 h-6 text-[#066abc]" />
              Banco de Cargos e Salários
            </CardTitle>
            <CardDescription>
              Mantenha os valores atualizados para garantir a precisão dos gráficos financeiros.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <CargosList />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default MaoDeObra;