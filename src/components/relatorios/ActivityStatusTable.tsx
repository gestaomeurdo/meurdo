import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ListChecks, Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useAtividades } from "@/hooks/use-atividades";

interface ActivityStatusTableProps {
  obraId: string;
}

const ActivityStatusTable = ({ obraId }: ActivityStatusTableProps) => {
  const { data: atividades, isLoading } = useAtividades(obraId);

  if (isLoading) {
    return (
      <Card className="col-span-full">
        <CardContent className="h-[300px] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (!atividades || atividades.length === 0) {
    return (
      <Card className="col-span-full border-dashed">
        <CardContent className="h-[200px] flex flex-col items-center justify-center text-muted-foreground">
          <ListChecks className="h-10 w-10 mb-2 opacity-20" />
          <p>Nenhuma atividade cadastrada para esta obra.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="col-span-full shadow-clean border-none rounded-3xl overflow-hidden">
      <CardHeader className="bg-muted/30 pb-4">
        <CardTitle className="flex items-center gap-2 text-lg font-bold">
          <ListChecks className="h-5 w-5 text-primary" />
          Status Detalhado das Atividades
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-white">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[40%]">Atividade / Serviço</TableHead>
                <TableHead className="w-[30%]">Progresso Real</TableHead>
                <TableHead className="w-[15%] text-right">Falta</TableHead>
                <TableHead className="w-[15%] text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {atividades.map((atv) => {
                const progress = atv.progresso_atual || 0;
                const remaining = 100 - progress;
                let statusColor = "bg-slate-100 text-slate-600";
                let statusText = "Não Iniciado";

                if (progress === 100) {
                  statusColor = "bg-green-100 text-green-700 border-green-200";
                  statusText = "Concluído";
                } else if (progress > 0) {
                  statusColor = "bg-blue-100 text-blue-700 border-blue-200";
                  statusText = "Em Andamento";
                }

                return (
                  <TableRow key={atv.id} className="hover:bg-muted/20">
                    <TableCell className="font-medium text-sm">
                      {atv.descricao}
                      {atv.responsavel_nome && (
                        <p className="text-[10px] text-muted-foreground font-normal mt-0.5">Resp: {atv.responsavel_nome}</p>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-[10px] font-bold text-muted-foreground">
                          <span>{progress}%</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium text-muted-foreground text-sm">
                      {remaining}%
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="outline" className={`border ${statusColor} text-[10px] uppercase font-bold tracking-wide whitespace-nowrap`}>
                        {statusText}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default ActivityStatusTable;