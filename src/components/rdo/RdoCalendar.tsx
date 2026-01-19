import React from "react";
import { DiarioObra } from "@/hooks/use-rdo";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import RdoDialog from "./RdoDialog";

interface RdoCalendarProps {
  obraId: string;
  rdoList: DiarioObra[];
  currentDate: Date;
}

const RdoCalendar = ({ obraId, rdoList, currentDate }: RdoCalendarProps) => {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const calendarDays = eachDayOfInterval({
    start: startDate,
    end: endDate,
  });

  const getRdosForDay = (day: Date) => {
    return rdoList.filter(rdo => isSameDay(parseISO(rdo.data_rdo), day));
  };

  const getStatusConfig = (status: string | undefined) => {
    switch (status) {
        case 'approved': 
            return "bg-emerald-500 text-white border-emerald-600 hover:bg-emerald-600";
        case 'pending': 
            return "bg-orange-500 text-white border-orange-600 hover:bg-orange-600";
        case 'rejected': 
            return "bg-red-500 text-white border-red-600 hover:bg-red-600";
        default: 
            return "bg-slate-200 text-slate-600 border-slate-300 hover:bg-slate-300";
    }
  };

  const getStatusLabel = (status: string | undefined) => {
    switch (status) {
        case 'approved': return "✓ Aprovado";
        case 'pending': return "⌛ Aguardando";
        case 'rejected': return "✖ Ajuste";
        default: return "✎ Rascunho";
    }
  };

  return (
    <div className="bg-card border rounded-xl overflow-hidden shadow-sm">
      <div className="grid grid-cols-7 border-b bg-muted/30">
        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => (
          <div key={day} className="py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {calendarDays.map((day, idx) => {
          const rdos = getRdosForDay(day);
          const isCurrentMonth = isSameMonth(day, monthStart);
          const isToday = isSameDay(day, new Date());

          return (
            <div
              key={day.toString()}
              className={cn(
                "min-h-[140px] p-2 border-r border-b relative transition-colors group hover:bg-muted/10",
                !isCurrentMonth && "bg-muted/20 opacity-40",
                idx % 7 === 6 && "border-r-0"
              )}
            >
              <div className={cn(
                "text-sm font-medium mb-1 w-7 h-7 flex items-center justify-center rounded-full transition-colors",
                isToday ? "bg-primary text-primary-foreground" : "text-foreground group-hover:bg-muted"
              )}>
                {format(day, 'd')}
              </div>

              <div className="mt-1 space-y-1 max-h-[100px] overflow-y-auto custom-scrollbar">
                {rdos.map((rdo) => (
                  <RdoDialog
                    key={rdo.id}
                    obraId={obraId}
                    date={new Date(rdo.data_rdo + 'T12:00:00')}
                    trigger={
                      <button className={cn(
                        "w-full text-left p-1.5 rounded-md text-[9px] font-black border shadow-sm transition-transform active:scale-95",
                        getStatusConfig(rdo.status)
                      )}>
                        <div className="truncate">{getStatusLabel(rdo.status)}</div>
                        <div className="truncate opacity-80 uppercase tracking-tighter">
                            {rdo.clima_condicoes?.split(',')[0].replace('M:', '') || 'Sem Clima'}
                        </div>
                      </button>
                    }
                  />
                ))}

                {isCurrentMonth && day <= new Date() && rdos.length === 0 && (
                  <RdoDialog
                    obraId={obraId}
                    date={day}
                    trigger={
                      <button className="w-full text-left p-1.5 rounded-md text-[10px] font-medium border border-dashed bg-orange-500/5 text-orange-600/70 hover:bg-orange-500/10 border-orange-200/50 transition-colors">
                        + Registrar
                      </button>
                    }
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RdoCalendar;