"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, CloudRain, Info, CheckCircle2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface OccurrenceHorizontalTimelineProps {
  rdos: any[];
}

const OccurrenceHorizontalTimeline = ({ rdos }: OccurrenceHorizontalTimelineProps) => {
  const sortedRdos = [...rdos].sort((a, b) => a.data_rdo.localeCompare(b.data_rdo));

  return (
    <Card className="border-none shadow-clean rounded-[2rem] bg-card overflow-hidden">
      <CardHeader className="bg-muted/30 pb-4">
        <CardTitle className="text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" /> Timeline de Ocorrências e Clima
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-10 pb-14 px-8 overflow-x-auto custom-scrollbar">
        <div className="min-w-[800px] relative">
          {/* Main Horizontal Line */}
          <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-100 dark:bg-slate-800 -translate-y-1/2" />
          
          <div className="flex justify-between items-center relative z-10">
            {sortedRdos.map((rdo) => {
              const hasRain = rdo.clima_condicoes?.toLowerCase().includes('chuva');
              const hasImpediment = rdo.impedimentos_comentarios && rdo.impedimentos_comentarios.trim().length > 0;
              
              return (
                <TooltipProvider key={rdo.id}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex flex-col items-center group cursor-help px-2">
                        {/* Day Label */}
                        <span className="text-[10px] font-black text-muted-foreground uppercase mb-6 group-hover:text-primary transition-colors">
                          {format(parseISO(rdo.data_rdo), "dd/MM")}
                        </span>

                        {/* Event Dot */}
                        <div className={cn(
                          "w-5 h-5 rounded-full border-4 border-white dark:border-slate-900 shadow-sm transition-all group-hover:scale-125",
                          hasImpediment ? "bg-red-500 ring-4 ring-red-500/10" : 
                          hasRain ? "bg-blue-500 ring-4 ring-blue-500/10" : 
                          "bg-emerald-400 opacity-30"
                        )} />

                        {/* Quick Icons underneath */}
                        <div className="mt-4 flex gap-1 h-4">
                          {hasRain && <CloudRain className="w-3 h-3 text-blue-500" />}
                          {hasImpediment && <AlertTriangle className="w-3 h-3 text-red-500" />}
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="p-3 max-w-xs rounded-xl bg-slate-900 text-white border-none">
                      <div className="space-y-2">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                          {format(parseISO(rdo.data_rdo), "dd 'de' MMMM", { locale: ptBR })}
                        </p>
                        <p className="text-xs font-medium">
                          {hasImpediment ? rdo.impedimentos_comentarios : "Nenhuma intercorrência técnica registrada."}
                        </p>
                        <div className="flex items-center gap-1.5 pt-1 border-t border-white/10">
                            <span className="text-[9px] font-bold uppercase">{rdo.clima_condicoes?.split(',')[0] || 'Sol'}</span>
                        </div>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default OccurrenceHorizontalTimeline;