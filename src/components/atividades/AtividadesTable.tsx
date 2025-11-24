import { useState } from "react";
import { Atividade, useDeleteAtividade, AtividadeStatus } from "@/hooks/use-atividades";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Clock, MoreVertical, Calendar, CheckCircle, AlertCircle, DollarSign, Route } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { showSuccess, showError } from "@/utils/toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import AtividadeDialog from "./AtividadeDialog";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface AtividadesTableProps {
  atividades: Atividade[];
  obraId: string;
}

const statusMap: Record<AtividadeStatus, { label: string; color: "default" | "secondary" | "destructive" | "outline"; icon: React.ElementType }> = {
  'Em andamento': { label: "Em Andamento", color: "default", icon: Clock },
  'Concluída': { label: "Concluída", color: "secondary", icon: CheckCircle },
  'Pendente': { label: "Pendente", color: "destructive", icon: AlertCircle },
};

const AtividadesTable = ({ atividades, obraId }: AtividadesTableProps) => {
  const deleteMutation = useDeleteAtividade();

  const formatTempo = (minutos: number | null) => {
    if (minutos === null || minutos === undefined) return "N/A";
    const hours = Math.floor(minutos / 60);
    const mins = minutos % 60;
    return `${hours}h ${mins}m`;
  };

  const formatCurrency = (value: number | null) => {
    if (value === null || value === undefined) return "N/A";
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync({ id, obraId });
      showSuccess(`Atividade excluída com sucesso.`);
    } catch (err) {
      showError(`Erro ao excluir atividade: ${err instanceof Error ? err.message : "Erro desconhecido"}`);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {atividades.map((atividade) => {
        const statusInfo = statusMap[atividade.status];
        return (
          <Card key={atividade.id} className="flex flex-col">
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    {format(new Date(atividade.data_atividade), 'dd/MM/yyyy', { locale: ptBR })}
                  </div>
                </CardTitle>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <AtividadeDialog obraId={obraId} initialData={atividade} trigger={<DropdownMenuItem onSelect={(e) => e.preventDefault()}>Editar</DropdownMenuItem>} />
                    <AlertDialog>
                      <AlertDialogTrigger asChild><DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive">Excluir</DropdownMenuItem></AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                          <AlertDialogDescription>Tem certeza que deseja excluir esta atividade? Esta ação é irreversível.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(atividade.id)} className="bg-destructive hover:bg-destructive/90">Excluir</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <CardDescription className="pt-2">
                <Badge variant={statusInfo.color}><statusInfo.icon className="h-3 w-3 mr-1" />{statusInfo.label}</Badge>
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow space-y-3">
              <p className="text-sm text-muted-foreground line-clamp-4">{atividade.descricao}</p>
              <div className="flex items-center text-sm">
                <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                <strong>Tempo Gasto:</strong><span className="ml-1">{formatTempo(atividade.tempo_gasto)}</span>
              </div>
              <div className="flex items-center text-sm">
                <DollarSign className="h-4 w-4 mr-2 text-muted-foreground" />
                <strong>Pedágio:</strong><span className="ml-1">{formatCurrency(atividade.pedagio)}</span>
              </div>
              <div className="flex items-center text-sm">
                <Route className="h-4 w-4 mr-2 text-muted-foreground" />
                <strong>Distância:</strong><span className="ml-1">{atividade.km_rodado ?? 'N/A'} km</span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default AtividadesTable;