"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Layers, Loader2, ClipboardCheck } from "lucide-react";
import { useAtividades } from "@/hooks/use-atividades";

interface ActivityProgressListProps {
  obraId: string;
  isLoading: boolean;
}

const ActivityProgressList = ({ obraId, isLoading }: ActivityProgressListProps) => {
  const { data: atividades } = useAtividades(obraId);

  if (isLoading) {
    return (
      <Card className="h-[450px] flex items-center justify-center border-none shadow-clean rounded-[2rem]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </Card>
    );
  }

  const mainActivities = atividades?.slice(0, 6) || [];

  return (
    <Card className="h-full border-none shadow-clean rounded-[2rem] bg-card overflow-hidden">
      <CardHeader className="bg-muted/30 pb-4">
        <CardTitle className="text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2">
          <Layers className="w-4 h-4" /> Progresso das Atividades
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        {mainActivities.length > 0 ? (
          mainActivities.map((atv) => (
            <div key={atv.id} className="space-y-2">
              <div className="flex justify-between items-end">
                <span className="text-xs font-bold uppercase tracking-tight text-foreground/80 line-clamp-1">
                  {atv.descricao}
                </span>
                <span className="text-xs font-black text-primary">{atv.progresso_atual}%</span>
              </div>
              <Progress value={atv.progresso_atual} className="h-2.5 bg-slate-100 dark:bg-slate-800" />
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center h-40 text-muted-foreground gap-2">
            <ClipboardCheck className="w-8 h-8 opacity-20" />
            <p className="text-xs font-medium uppercase tracking-widest">Nenhuma atividade no cronograma</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ActivityProgressList;