import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ListChecks, Loader2, Calendar, AlertCircle, CheckCircle2 } from "lucide-react";
import { useAtividades } from "@/hooks/use-atividades";
import { formatDate } from "@/utils/formatters";
import { differenceInDays, parseISO } from "date-fns";

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
      <Card className="col-span-full border-dashed bg-accent/10">
        <CardContent className="h-[200px] flex flex-col items-center justify-center text-muted-foreground">
          <ListChecks className="h-10 w-10 mb-2 opacity-20" />
          <p>Nenhuma atividade cadastrada para esta obra.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="col-span-full">
      <div className="flex items-center gap-2 mb-4">
        <ListChecks className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-bold text-foreground">Status Detalhado das Atividades</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {atividades.map((atv) => {
          const progress = atv.progresso_atual || 0;
          const remaining = 100 - progress;
          
          // Lógica de Status (Atrasado/Em dia)
          let statusLabel = "Em Dia";
          let statusVariant: "default" | "destructive" | "secondary" | "outline" = "outline";
          let statusColorClass = "text-green-600 bg-green-100 border-green-200";

          if (progress === 100) {
            statusLabel = "Concluído";
            statusVariant = "secondary";
            statusColorClass = "text-blue-600 bg-blue-100 border-blue-200";
          } else if (atv.data_prevista) {
            const today = new Date();
            const deadline = parseISO(atv.data_prevista);
            // Se hoje é depois do prazo e não tá 100%
            if (today > deadline) {
                const daysLate = differenceInDays(today, deadline);
                statusLabel = `${daysLate} Dias Atrasado`;
                statusVariant = "destructive";
                statusColorClass = "text-red-600 bg-red-100 border-red-200";
            }
          }

          return (
            <Card key={atv.id} className="shadow-sm hover:shadow-md transition-shadow border rounded-2xl overflow-hidden">
              <CardContent className="p-5">
                {/* Topo: Nome e Status */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="font-bold text-base leading-tight text-foreground mb-1">
                      {atv.descricao}
                    </h4>
                    {atv.data_prevista && (
                      <div className="flex items-center text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3 mr-1" />
                        Previsto: {formatDate(atv.data_prevista)}
                      </div>
                    )}
                  </div>
                  <Badge variant={statusVariant} className={`whitespace-nowrap ${statusColorClass} border`}>
                    {statusLabel}
                  </Badge>
                </div>

                {/* Barra de Progresso Grossa */}
                <div className="relative h-3 w-full bg-slate-200 rounded-full overflow-hidden mb-3">
                  <div 
                    className="absolute top-0 left-0 h-full bg-[#066abc] transition-all duration-500 ease-out rounded-full"
                    style={{ width: `${progress}%` }}
                  />
                </div>

                {/* Dados Abaixo da Barra */}
                <div className="flex justify-between items-center text-xs font-medium">
                  <div className="flex items-center gap-1 text-[#066abc]">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Concluído: {progress}%</span>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Restante: {remaining}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default ActivityStatusTable;