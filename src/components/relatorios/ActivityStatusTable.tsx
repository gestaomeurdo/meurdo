import { Card, CardContent } from "@/components/ui/card";
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
          
          let statusLabel = "Em Dia";
          let statusClass = "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20";

          if (progress === 100) {
            statusLabel = "Concluído";
            statusClass = "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20";
          } else if (atv.data_prevista) {
            const today = new Date();
            const deadline = parseISO(atv.data_prevista);
            if (today > deadline) {
                const daysLate = differenceInDays(today, deadline);
                statusLabel = `${daysLate} Dias Atrasado`;
                statusClass = "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20";
            }
          }

          return (
            <Card key={atv.id} className="shadow-sm hover:shadow-md transition-shadow border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-card">
              <CardContent className="p-5">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="font-bold text-base leading-tight text-foreground mb-1 uppercase tracking-tight">
                      {atv.descricao}
                    </h4>
                    {atv.data_prevista && (
                      <div className="flex items-center text-[10px] font-bold text-muted-foreground uppercase">
                        <Calendar className="w-3 h-3 mr-1" />
                        Previsto: {formatDate(atv.data_prevista)}
                      </div>
                    )}
                  </div>
                  <Badge variant="outline" className={`whitespace-nowrap px-2.5 py-0.5 font-black uppercase text-[9px] border ${statusClass}`}>
                    {statusLabel}
                  </Badge>
                </div>

                <div className="relative h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-3">
                  <div 
                    className="absolute top-0 left-0 h-full bg-blue-500 transition-all duration-500 ease-out rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)]"
                    style={{ width: `${progress}%` }}
                  />
                </div>

                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                  <div className="flex items-center gap-1 text-blue-500">
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