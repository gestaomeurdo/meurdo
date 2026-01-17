import { DiarioObra } from "@/hooks/use-rdo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format, parseISO } from "date-fns";
import { Eye, Loader2, ClipboardList, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import RdoDialog from "../rdo/RdoDialog";
import { Link } from "react-router-dom";
import { formatDate } from "@/utils/formatters";

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
      <div className="text-center py-12 bg-muted/20 border-2 border-dashed rounded-2xl">
        <ClipboardList className="w-12 h-12 mx-auto text-primary/30 mb-3" />
        <h3 className="font-bold text-lg">Nenhum diário recente</h3>
        <p className="text-sm text-muted-foreground mt-1 px-4">
          Você ainda não registrou nenhum diário de obra. Comece agora para manter o histórico.
        </p>
        <Button variant="link" className="mt-4 text-primary font-bold" asChild>
          <Link to="/gestao-rdo">Ir para Gestão de RDO <ArrowRight className="ml-2 w-4 h-4" /></Link>
        </Button>
      </div>
    );
  }

  if (isMobile) {
    return (
      <div className="space-y-3">
        {recentRdos.map((rdo) => (
          <Card key={rdo.id} className="shadow-clean border-none rounded-xl overflow-hidden">
            <CardContent className="p-4">
              <RdoDialog
                obraId={rdo.obra_id}
                date={new Date(rdo.data_rdo + 'T12:00:00')}
                trigger={
                  <div className="flex justify-between items-center cursor-pointer">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-primary uppercase tracking-widest">{rdo.obra_nome}</p>
                      <p className="text-lg font-bold">{formatDate(rdo.data_rdo)}</p>
                      <Badge variant={statusColorMap[rdo.status_dia]} className="text-[9px] uppercase font-black">
                        {rdo.status_dia}
                      </Badge>
                    </div>
                    <Eye className="w-5 h-5 text-primary/40" />
                  </div>
                }
              />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="rounded-xl border overflow-hidden bg-card shadow-sm">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow>
            <TableHead className="w-[120px]">Data</TableHead>
            <TableHead>Obra</TableHead>
            <TableHead className="w-[180px]">Status</TableHead>
            <TableHead className="text-right w-[100px]">Visualizar</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {recentRdos.map((rdo) => {
            const rdoDate = new Date(rdo.data_rdo + 'T12:00:00');
            return (
              <TableRow key={rdo.id} className="hover:bg-accent/30 transition-colors">
                <TableCell className="font-bold">{formatDate(rdo.data_rdo)}</TableCell>
                <TableCell className="font-medium">{rdo.obra_nome}</TableCell>
                <TableCell>
                  <Badge variant={statusColorMap[rdo.status_dia]} className="text-[10px] uppercase font-bold">
                    {rdo.status_dia}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <RdoDialog
                    obraId={rdo.obra_id}
                    date={rdoDate}
                    trigger={
                      <Button variant="ghost" size="icon" className="rounded-full hover:bg-primary/10">
                        <Eye className="w-4 h-4 text-primary" />
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