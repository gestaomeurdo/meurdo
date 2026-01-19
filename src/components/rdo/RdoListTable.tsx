import { DiarioObra, useDeleteRdo } from "@/hooks/use-rdo";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Trash2, Sun, Cloud, CloudRain, CloudLightning, AlertTriangle, Loader2 } from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import RdoDialog from "./RdoDialog";
import { Badge } from "@/components/ui/badge";

interface RdoListTableProps {
  rdoList: DiarioObra[];
  obraId: string;
  isLoading: boolean;
}

const getClimaIcon = (climaString: string | null) => {
    if (!climaString) return Cloud;
    if (climaString.includes('Chuva Forte')) return CloudLightning;
    if (climaString.includes('Chuva')) return CloudRain;
    if (climaString.includes('Nublado')) return Cloud;
    if (climaString.includes('Sol')) return Sun;
    return Cloud;
};

const getStatusConfig = (status: string | undefined) => {
    switch (status) {
        case 'approved': 
            return { label: "Aprovado", variant: "default" as const, class: "bg-emerald-600 hover:bg-emerald-600" };
        case 'pending': 
            return { label: "Aguardando", variant: "default" as const, class: "bg-orange-500 hover:bg-orange-500" };
        case 'rejected': 
            return { label: "Correção", variant: "destructive" as const, class: "" };
        default: 
            return { label: "Rascunho", variant: "outline" as const, class: "bg-slate-50 text-slate-500" };
    }
};

const RdoListTable = ({ rdoList, obraId, isLoading }: RdoListTableProps) => {
  const deleteMutation = useDeleteRdo();

  const handleDelete = async (id: string, date: string) => {
    try {
      await deleteMutation.mutateAsync({ id, obraId });
      showSuccess(`RDO de ${format(parseISO(date), 'dd/MM/yyyy')} excluído com sucesso.`);
    } catch (err) {
      showError(`Erro ao excluir RDO: ${err instanceof Error ? err.message : "Erro desconhecido"}`);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Carregando histórico...</span>
      </div>
    );
  }

  if (!rdoList || rdoList.length === 0) {
    return (
      <div className="text-center py-12 border border-dashed rounded-lg bg-muted/50">
        <AlertTriangle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">Nenhum RDO encontrado</h2>
        <p className="text-muted-foreground">Os diários criados aparecerão aqui.</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border overflow-hidden bg-card">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow>
            <TableHead className="w-[120px]">Data</TableHead>
            <TableHead className="w-[140px]">Dia</TableHead>
            <TableHead className="w-[120px]">Clima</TableHead>
            <TableHead className="min-w-[150px]">Status Aprovação</TableHead>
            <TableHead>Responsável</TableHead>
            <TableHead className="text-right w-[100px]">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rdoList.map((rdo) => {
            const dateObj = parseISO(rdo.data_rdo);
            const dayOfWeek = format(dateObj, 'EEEE', { locale: ptBR });
            const ClimaIcon = getClimaIcon(rdo.clima_condicoes);
            const statusCfg = getStatusConfig(rdo.status);
            const rdoDate = new Date(rdo.data_rdo + 'T12:00:00');

            return (
              <TableRow
                key={rdo.id}
                className="hover:bg-muted/30 transition-colors cursor-pointer group"
              >
                <TableCell className="font-medium p-0">
                  <RdoDialog
                    obraId={obraId}
                    date={rdoDate}
                    trigger={
                      <div className="w-full h-full p-4 flex items-center font-bold">
                        {format(dateObj, 'dd/MM/yyyy')}
                      </div>
                    }
                  />
                </TableCell>
                <TableCell className="capitalize text-muted-foreground p-0">
                  <RdoDialog
                    obraId={obraId}
                    date={rdoDate}
                    trigger={
                      <div className="w-full h-full p-4 flex items-center">
                        {dayOfWeek}
                      </div>
                    }
                  />
                </TableCell>
                <TableCell className="p-0">
                  <RdoDialog
                    obraId={obraId}
                    date={rdoDate}
                    trigger={
                      <div className="w-full h-full p-4 flex items-center gap-2">
                        <ClimaIcon className="w-4 h-4 text-primary" />
                        <span className="text-xs truncate max-w-[100px]">{rdo.clima_condicoes?.split(',')[0].replace('M:', '') || 'N/A'}</span>
                      </div>
                    }
                  />
                </TableCell>
                <TableCell className="p-0">
                  <RdoDialog
                    obraId={obraId}
                    date={rdoDate}
                    trigger={
                      <div className="w-full h-full p-4 flex items-center">
                        <Badge variant={statusCfg.variant} className={cn("text-[10px] font-black uppercase tracking-widest px-3 py-1", statusCfg.class)}>
                          {statusCfg.label}
                        </Badge>
                      </div>
                    }
                  />
                </TableCell>
                <TableCell className="text-sm p-0 font-medium">
                   <RdoDialog
                    obraId={obraId}
                    date={rdoDate}
                    trigger={
                      <div className="w-full h-full p-4 flex items-center">
                        {rdo.responsavel || 'N/A'}
                      </div>
                    }
                  />
                </TableCell>
                <TableCell className="text-right p-4" onClick={(e) => e.stopPropagation()}>
                  <div className="flex justify-end gap-2">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" title="Excluir" className="text-destructive hover:bg-destructive/10">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                          <AlertDialogDescription>
                            Deseja excluir o RDO de <span className="font-bold">{format(dateObj, 'dd/MM/yyyy')}</span>?
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(rdo.id, rdo.data_rdo)}
                            disabled={deleteMutation.isPending}
                            className="bg-destructive hover:bg-destructive/90"
                          >
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};

export default RdoListTable;