import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2, Loader2, MapPin, Calendar, Construction } from "lucide-react";
import ObraDialog from "@/components/obras/ObraDialog";
import { useDeleteObra, useObras, Obra } from "@/hooks/use-obras";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { showSuccess, showError } from "@/utils/toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

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

  const handleDelete = async (id: string, nome: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      showSuccess(`Obra "${nome}" excluída com sucesso.`);
    } catch (err) {
      showError(`Erro ao excluir obra: ${err instanceof Error ? error.message : "Erro desconhecido"}`);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="p-6 flex justify-center items-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Carregando obras...</span>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="p-6 text-red-500">
          Erro ao carregar obras: {error.message}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Gestão de Obras ({obras?.length || 0})</h1>
          <ObraDialog />
        </div>

        {obras && obras.length === 0 ? (
          <div className="text-center py-12 border border-dashed rounded-lg bg-muted/50">
            <Construction className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Nenhuma obra cadastrada</h2>
            <p className="text-muted-foreground mb-4">
              Comece criando sua primeira obra para gerenciar custos e documentos.
            </p>
            <ObraDialog trigger={
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Criar Obra Agora
              </Button>
            } />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {obras?.map((obra) => (
              <Card key={obra.id} className="flex flex-col">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-xl truncate pr-4">{obra.nome}</CardTitle>
                    <Badge variant={statusColorMap[obra.status]} className="capitalize">
                      {statusMap[obra.status]}
                    </Badge>
                  </div>
                  <CardDescription className="flex items-center mt-2">
                    <MapPin className="w-4 h-4 mr-1 text-muted-foreground" />
                    {obra.endereco || "Endereço não informado"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-grow space-y-2 text-sm">
                  <p>
                    <span className="font-medium">Cliente:</span> {obra.dono_cliente || "N/A"}
                  </p>
                  <p>
                    <span className="font-medium">Orçamento Inicial:</span> {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(obra.orcamento_inicial)}
                  </p>
                  <p className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1 text-muted-foreground" />
                    <span className="font-medium">Início:</span> {format(new Date(obra.data_inicio), 'dd/MM/yyyy', { locale: ptBR })}
                    {obra.previsao_entrega && (
                      <>
                        <span className="mx-2 text-muted-foreground">|</span>
                        <span className="font-medium">Entrega:</span> {format(new Date(obra.previsao_entrega), 'dd/MM/yyyy', { locale: ptBR })}
                      </>
                    )}
                  </p>
                </CardContent>
                <div className="p-4 border-t flex justify-end space-x-2">
                  <ObraDialog 
                    initialData={obra} 
                    trigger={
                      <Button variant="outline" size="icon" title="Editar">
                        <Edit className="w-4 h-4" />
                      </Button>
                    } 
                  />
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="icon" title="Excluir">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta ação não pode ser desfeita. Isso excluirá permanentemente a obra <span className="font-bold">"{obra.nome}"</span> e todos os dados associados (despesas, documentos, etc.).
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={() => handleDelete(obra.id, obra.nome)}
                          disabled={deleteMutation.isPending}
                          className="bg-destructive hover:bg-destructive/90"
                        >
                          {deleteMutation.isPending ? "Excluindo..." : "Excluir"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
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