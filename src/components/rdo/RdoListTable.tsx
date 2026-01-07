import { DiarioObra, RdoClima, useDeleteRdo } from "@/hooks/use-rdo";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Sun, Cloud, CloudRain, CloudLightning, AlertTriangle, Loader2, Eye } from "lucide-react";
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

const climaIconMap: Record<RdoClima, React.ElementType> = {
  'Sol': Sun,
  'Nublado': Cloud,
  'Chuva Leve': CloudRain,
  'Chuva Forte': CloudLightning,
};

const statusColorMap: Record<DiarioObra['status_dia'], "default" | "secondary" | "destructive" | "outline"> = {
  'Operacional': "default",
  'Parcialmente Paralisado': "secondary",
  'Totalmente Paralisado - Não Praticável': "destructive",
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
        <span className="ml-2 text-muted-foreground">Carregando RDOs...</span>
      </div>
    );
  }

  if (!rdoList || rdoList.length === 0) {
    return (
      <div className="text-center py-12 border border-dashed rounded-lg bg-muted/50">
        <AlertTriangle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">Nenhum RDO encontrado</h2>
        <p className="text-muted-foreground">Comece criando o primeiro Relatório Diário de Obra.</p>
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
            <TableHead className="min-w-[200px]">Status</TableHead>
            <TableHead>Responsável</TableHead>
            <TableHead className="text-right w-[120px]">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rdoList.map((rdo) => {
            const dateObj = parseISO(rdo.data_rdo);
            const dayOfWeek = format(dateObj, 'EEEE', { locale: ptBR });
            const ClimaIcon = rdo.clima_condicoes ? climaIconMap[rdo.clima_condicoes] : Cloud;
            const statusColor = statusColorMap[rdo.status_dia];
            const rdoDate = new Date(rdo.data_rdo + 'T12:00:00');

            return (
              <TableRow key={rdo.id} className="hover:bg-muted/30 transition-colors cursor-pointer group">
                <TableCell className="font-medium">{format(dateObj, 'dd/MM/yyyy')}</TableCell>
                <TableCell className="capitalize text-muted-foreground">{dayOfWeek}</TableCell>
                <TableCell>
                  <div className="flex items-center text-sm">
                    <ClimaIcon className="w-4 h-4 mr-2 text-primary" />
                    {rdo.clima_condicoes || 'N/A'}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={statusColor} className="text-[10px] md:text-xs">
                    {rdo.status_dia}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm">
                  {(rdo as any).responsavel || 'N/A'}
                </TableCell>
                <TableCell className="text-right space-x-1" onClick={(e) => e.stopPropagation()}>
                  <RdoDialog 
                    obraId={obraId}
                    date={rdoDate}
                    trigger={
                      <Button variant="ghost" size="icon" title="Visualizar/Editar">
                        <Edit className="w-4 h-4" />
                      </Button>
                    }
                  />
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
                          Tem certeza que deseja excluir o RDO de <span className="font-bold">{format(dateObj, 'dd/MM/yyyy')}</span>? Esta ação é irreversível.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={() => handleDelete(rdo.id, rdo.data_rdo)}
                          disabled={deleteMutation.isPending}
                          className="bg-destructive hover:bg-destructive/90"
                        >
                          {deleteMutation.isPending ? "Excluindo..." : "Excluir"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
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