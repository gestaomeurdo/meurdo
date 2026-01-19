import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Plus, Loader2, Construction, Zap, ImageIcon, MapPin } from "lucide-react";
import ObraDialog from "@/components/obras/ObraDialog";
import { useObras } from "@/hooks/use-obras";
import { Card, CardContent } from "@/components/ui/card";
import { useSubscriptionLimits } from "@/hooks/use-subscription-limits";
import { useState } from "react";
import UpgradeModal from "@/components/subscription/UpgradeModal";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const Obras = () => {
  const { data: obras, isLoading } = useObras();
  const { canCreateObra, isPro, obraCount, limits } = useSubscriptionLimits();
  const [showUpgrade, setShowUpgrade] = useState(false);

  if (isLoading) return <DashboardLayout><div className="p-6 flex justify-center items-center h-[60vh]"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-black text-foreground uppercase tracking-tight">Minhas Obras <span className="text-primary">({obras?.length || 0})</span></h1>
            <p className="text-muted-foreground text-sm font-medium">Gerencie seu portfólio de construção em tempo real.</p>
          </div>
          
          {canCreateObra ? (
            <ObraDialog trigger={<Button size="lg" className="rounded-xl shadow-lg bg-[#066abc] hover:bg-[#066abc]/90 font-bold"><Plus className="w-5 h-5 mr-2" /> Nova Obra</Button>} />
          ) : (
            <Button size="lg" onClick={() => setShowUpgrade(true)} className="rounded-xl bg-orange-500 hover:bg-orange-600 shadow-lg font-bold"><Zap className="w-5 h-5 mr-2" /> Limite Atingido</Button>
          )}
        </div>
        
        <UpgradeModal open={showUpgrade} onOpenChange={setShowUpgrade} title="Limite de 1 Obra Atingido" description="Engenheiros PRO gerenciam obras ilimitadas e geram relatórios de performance avançados." />

        {obras && obras.length === 0 ? (
          <Card className="border-dashed border-2 py-20 text-center bg-accent/10 rounded-[3rem]">
            <CardContent>
              <Construction className="w-20 h-20 mx-auto text-primary/20 mb-6" />
              <h2 className="text-2xl font-black uppercase tracking-tight mb-2">Sua jornada começa aqui</h2>
              <p className="text-muted-foreground mb-8 max-w-sm mx-auto font-medium">Cadastre sua primeira obra para começar a gerar Diários de Obra profissionais.</p>
              <ObraDialog trigger={<Button size="lg" className="rounded-2xl px-8 h-14 bg-[#066abc] font-black uppercase text-xs tracking-widest shadow-xl shadow-blue-500/20">Cadastrar Minha Obra</Button>} />
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {obras?.map((obra) => (
                <Link to={`/obras/${obra.id}`} key={obra.id} className="group">
                    <Card className="hover:shadow-2xl transition-all cursor-pointer border-none rounded-[2.5rem] overflow-hidden bg-card shadow-clean h-full flex flex-col group-hover:-translate-y-1">
                        <div className="h-48 w-full bg-muted relative overflow-hidden">
                            {obra.foto_url ? (
                                <img src={obra.foto_url} alt={obra.nome} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-accent/30">
                                    <ImageIcon className="w-12 h-12 text-muted-foreground/20" />
                                </div>
                            )}
                            <div className="absolute top-4 right-4">
                                <Badge className={cn(
                                    "text-[9px] font-black uppercase tracking-widest border-none shadow-lg px-3 py-1",
                                    obra.status === 'ativa' ? "bg-emerald-500 text-white" : obra.status === 'pausada' ? "bg-orange-500 text-white" : "bg-blue-500 text-white"
                                )}>
                                    {obra.status}
                                </Badge>
                            </div>
                            <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-black/60 to-transparent"></div>
                        </div>
                        <CardContent className="p-6 flex-1 flex flex-col justify-between">
                            <div>
                                <h3 className="text-xl font-black uppercase tracking-tight mb-2 line-clamp-1 group-hover:text-primary transition-colors">{obra.nome}</h3>
                                <div className="flex items-center text-[11px] text-muted-foreground font-bold uppercase mb-4">
                                    <MapPin className="w-3.5 h-3.5 mr-1.5 text-primary" />
                                    <span className="truncate">{obra.endereco || "Local não informado"}</span>
                                </div>
                            </div>
                            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Ver Detalhes</span>
                                <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                                    <ImageIcon className="w-4 h-4" />
                                </div>
                            </div>
                        </CardContent>
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