import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2, Loader2, MapPin, Calendar, Construction, Zap, ArrowRight } from "lucide-react";
import ObraDialog from "@/components/obras/ObraDialog";
import { useDeleteObra, useObras, Obra } from "@/hooks/use-obras";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { showSuccess, showError } from "@/utils/toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { formatCurrency, formatDate } from "@/utils/formatters";
import { useCanCreateObra } from "@/hooks/use-subscription-limits";
import { useState } from "react";
import LimitReachedModal from "@/components/subscription/LimitReachedModal";
import { cn } from "@/lib/utils";

const statusMap: Record<Obra['status'], string> = {
  ativa: "Ativa",
  concluida: "Concluída",
  pausada: "Pausada",
};

const statusColorMap: Record<Obra['status'], "default" | "secondary" | "destructive" | "outline"> = {
  ativa: "default",
  concluida: "secondary",
  pausada: "destructive",
};

const Obras = () => {
  const { data: obras, isLoading, error } = useObras();
  const deleteMutation = useDeleteObra();
  const { canCreate, isPro, isLoading: isLoadingLimits } = useCanCreateObra();
  const [limitModalOpen, setLimitModalOpen] = useState(false);

  const handleDelete = async (id: string, nome: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      showSuccess(`Obra "${nome}" excluída.`);
    } catch (err) {
      showError(`Erro ao excluir obra.`);
    }
  };

  if (isLoading || isLoadingLimits) {
    return (
      <DashboardLayout>
        <div className="p-6 flex justify-center items-center h-[60vh]">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-black text-foreground tracking-tight">Obras <span className="text-primary">({obras?.length || 0})</span></h1>
            <p className="text-muted-foreground text-sm">Gerencie seu portfólio de construção.</p>
          </div>
          
          <div className="flex items-center gap-3">
            {canCreate ? (
              <ObraDialog trigger={
                <Button size="lg" className="rounded-xl shadow-lg shadow-primary/20 hover:scale-105 transition-transform">
                  <Plus className="w-5 h-5 mr-2" />
                  Nova Obra
                </Button>
              } />
            ) : (
              <Button size="lg" onClick={() => setLimitModalOpen(true)} className="rounded-xl shadow-lg hover:scale-105 transition-transform bg-orange-500 hover:bg-orange-600">
                <Zap className="w-5 h-5 mr-2 fill-current" />
                Desbloquear PRO
              </Button>
            )}
          </div>
        </div>

        <LimitReachedModal open={limitModalOpen} onOpenChange={setLimitModalOpen} />

        {obras && obras.length === 0 ? (
          <Card className="border-dashed py-20 text-center shadow-none bg-accent/20 rounded-2xl">
            <CardContent>
              <Construction className="w-16 h-16 mx-auto text-primary/30 mb-6" />
              <h2 className="text-xl font-bold mb-2">Sua jornada começa aqui</h2>
              <p className="text-muted-foreground mb-8 max-w-sm mx-auto">
                Cadastre sua primeira obra para começar a gerar diários profissionais.
              </p>
              <ObraDialog trigger={<Button size="lg" className="rounded-xl">Cadastrar Minha Obra</Button>} />
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {obras?.map((obra) => (
              <Card key={obra.id} className="group hover:shadow-xl transition-all duration-300 border-none bg-card shadow-clean rounded-2xl overflow-hidden flex flex-col">
                <div className={cn("h-2 w-full", 
                    obra.status === 'ativa' ? "bg-primary" : 
                    obra.status === 'concluida' ? "bg-blue-500" : "bg-destructive")}></div>
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant={statusColorMap[obra.status]} className="rounded-full px-3 py-0.5 text-[10px] font-black uppercase tracking-widest">
                      {statusMap[obra.status]}
                    </Badge>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <ObraDialog initialData={obra} trigger={<Button variant="ghost" size="icon" className="h-8 w-8 rounded-full"><Edit className="w-4 h-4 text-muted-foreground" /></Button>} />
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-destructive/10"><Trash2 className="w-4 h-4 text-destructive" /></Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="rounded-2xl">
                          <AlertDialogHeader><AlertDialogTitle>Excluir obra?</AlertDialogTitle><AlertDialogDescription>Isso removerá permanentemente os diários vinculados.</AlertDialogDescription></AlertDialogHeader>
                          <AlertDialogFooter><AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => handleDelete(obra.id, obra.nome)} className="bg-destructive rounded-xl">Confirmar Exclusão</AlertDialogAction></AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                  <CardTitle className="text-xl font-bold truncate leading-tight">{obra.nome}</CardTitle>
                  <CardDescription className="flex items-center text-xs pt-1">
                    <MapPin className="w-3 h-3 mr-1 text-primary" />
                    {obra.endereco || "Local não informado"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-grow space-y-4 pt-0">
                   <div className="grid grid-cols-2 gap-4 bg-accent/30 p-3 rounded-xl">
                      <div className="space-y-1">
                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Orçamento</p>
                        <p className="text-sm font-bold text-primary">{formatCurrency(obra.orcamento_inicial)}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Início</p>
                        <p className="text-sm font-bold">{formatDate(obra.data_inicio)}</p>
                      </div>
                   </div>
                   <div className="space-y-1">
                      <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Proprietário / Cliente</p>
                      <p className="text-sm font-medium">{obra.dono_cliente || "N/A"}</p>
                   </div>
                </CardContent>
                <div className="px-6 py-4 border-t bg-accent/10">
                  <Button variant="ghost" className="w-full justify-between text-primary font-bold hover:bg-primary/10 rounded-xl" asChild>
                    <a href="/gestao-rdo">
                      Ver Diários de Obra
                      <ArrowRight className="w-4 h-4" />
                    </a>
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Obras;