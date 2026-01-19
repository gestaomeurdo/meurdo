import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Plus, Loader2, Construction, Zap } from "lucide-react";
import ObraDialog from "@/components/obras/ObraDialog";
import { useObras } from "@/hooks/use-obras";
import { Card, CardContent } from "@/components/ui/card";
import { useSubscriptionLimits } from "@/hooks/use-subscription-limits";
import { useState } from "react";
import UpgradeModal from "@/components/subscription/UpgradeModal";
import { Link } from "react-router-dom";

const Obras = () => {
  const { data: obras, isLoading } = useObras();
  const { canCreateObra, isPro, obraCount, limits } = useSubscriptionLimits();
  const [showUpgrade, setShowUpgrade] = useState(false);

  if (isLoading) return <DashboardLayout><div className="p-6 flex justify-center items-center h-[60vh]"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 space-y-8">
        <div className="flex justify-between items-center">
          <div className="space-y-1">
            <h1 className="text-3xl font-black text-foreground">Obras <span className="text-primary">({obras?.length || 0})</span></h1>
            <p className="text-muted-foreground text-sm">Gerencie seu portfólio de construção.</p>
          </div>
          
          {canCreateObra ? (
            <ObraDialog trigger={<Button size="lg" className="rounded-xl shadow-lg"><Plus className="w-5 h-5 mr-2" /> Nova Obra</Button>} />
          ) : (
            <Button size="lg" onClick={() => setShowUpgrade(true)} className="rounded-xl bg-orange-500 hover:bg-orange-600 shadow-lg"><Zap className="w-5 h-5 mr-2" /> Limite Atingido</Button>
          )}
        </div>
        
        <UpgradeModal open={showUpgrade} onOpenChange={setShowUpgrade} title="Limite de 1 Obra Atingido" description="Engenheiros PRO gerenciam obras ilimitadas e geram relatórios de performance avançados." />

        {obras && obras.length === 0 ? (
          <Card className="border-dashed py-20 text-center bg-accent/20 rounded-2xl">
            <CardContent>
              <Construction className="w-16 h-16 mx-auto text-primary/30 mb-6" />
              <h2 className="text-xl font-bold mb-2">Sua jornada começa aqui</h2>
              <ObraDialog trigger={<Button size="lg" className="rounded-xl">Cadastrar Minha Obra</Button>} />
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {obras?.map((obra) => (
                <Link to={`/obras/${obra.id}`} key={obra.id}>
                    <Card className="hover:shadow-xl transition-all cursor-pointer border-none rounded-[2rem] overflow-hidden bg-card p-6 shadow-clean">
                        <h3 className="text-xl font-black uppercase mb-4">{obra.nome}</h3>
                        <Badge>{obra.status}</Badge>
                    </Card>
                </Link>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Obras;