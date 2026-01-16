import { DiarioObra } from "@/hooks/use-rdo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format, parseISO } from "date-fns";
import { Eye, Edit, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import RdoDialog from "../rdo/RdoDialog";
import { Link } from "react-router-dom";

interface RecentRdoListProps {
  recentRdos: (DiarioObra & { obra_nome: string })[];
  obraId: string;
  isLoading: boolean;
}

const statusColorMap: Record<DiarioObra['status_dia'], "default" | "secondary" | "destructive" | "outline"> = {
  'Operacional': "default",
  'Parcialmente Paralisado': "secondary",
  'Totalmente Paralisado - Não Praticável': "destructive",
};

const RecentRdoList = ({ recentRdos, obraId, isLoading }: RecentRdoListProps) => {
  const isMobile = useIsMobile();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-40">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (recentRdos.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground border border-dashed rounded-lg">
        <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
        <p>Nenhum RDO recente encontrado.</p>
        <p className="text-sm mt-1">Crie um novo RDO para começar.</p>
      </div>
    );
  }

  // Mobile View: Card List
  if (isMobile) {
    return (
      <div className="space-y-3">
        {recentRdos.map((rdo) => (
          <Card key={rdo.id} className="shadow-sm">
            <CardContent className="p-4">
              <RdoDialog
                obraId={rdo.obra_id}
                date={new Date(rdo.data_rdo + 'T12:00:00')}
                trigger={
                  <div className="flex justify-between items-center cursor-pointer">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">{rdo.obra_nome}</p>
                      <p className="text-lg font-bold">{format(parseISO(rdo.data_rdo), 'dd/MM/yyyy')}</p>
                      <Badge variant={statusColorMap[rdo.status_dia]} className="capitalize text-[10px]">
                        {rdo.status_dia}
                      </Badge>
                    </div>
                    <Button variant="ghost" size="icon">
                      <Eye className="w-5 h-5 text-primary" />
                    </Button>
                  </div>
                }
              />
            </CardContent>
          </Card>
        ))}
        <div className="text-center pt-4">
          <Link to="/gestao-rdo" className="text-sm text-primary hover:underline">Ver todos os RDOs</Link>
        </div>
      </div>
    );
  }

  // Desktop View: Table
  return (
    <div className="rounded-xl border overflow-hidden bg-card shadow-sm">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow>
            <TableHead className="w-[120px]">Data</TableHead>
            <TableHead>Obra</TableHead>
            <TableHead className="w-[180px]">Status</TableHead>
            <TableHead className="text-right w-[100px]">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {recentRdos.map((rdo) => {
            const rdoDate = new Date(rdo.data_rdo + 'T12:00:00');
            return (
              <TableRow key={rdo.id}>
                <TableCell className="font-medium">{format(parseISO(rdo.data_rdo), 'dd/MM/yyyy')}</TableCell>
                <TableCell>{rdo.obra_nome}</TableCell>
                <TableCell>
                  <Badge variant={statusColorMap[rdo.status_dia]} className="capitalize">
                    {rdo.status_dia}
                  </Badge>
                </TableCell>
                <TableCell className="text-right space-x-2">
                  <RdoDialog
                    obraId={rdo.obra_id}
                    date={rdoDate}
                    trigger={
                      <Button variant="ghost" size="icon" title="Visualizar">
                        <Eye className="w-4 h-4" />
                      </Button>
                    }
                  />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};

export default RecentRdoList;