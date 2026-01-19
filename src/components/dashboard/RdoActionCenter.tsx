"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, FileClock, AlertTriangle } from "lucide-react";
import { DiarioObra } from "@/hooks/use-rdo";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import RdoDialog from "../rdo/RdoDialog";

interface RdoActionCenterProps {
  rdos: (DiarioObra & { obra_nome: string })[];
  isLoading: boolean;
}

const RdoActionCenter = ({ rdos, isLoading }: RdoActionCenterProps) => {
  if (isLoading) return null;
  if (!rdos || rdos.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 px-1">
        <h2 className="text-xl font-black uppercase tracking-tight text-slate-800 dark:text-slate-100">Ações Pendentes</h2>
        <Badge variant="secondary" className="bg-orange-100 text-orange-600 dark:bg-orange-950 dark:text-orange-400 border-none font-black">{rdos.length}</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {rdos.map((rdo) => (
          <RdoDialog 
            key={rdo.id} 
            obraId={rdo.obra_id} 
            date={new Date(rdo.data_rdo + 'T12:00:00')} 
            trigger={
              <Card className={cn(
                  "cursor-pointer border-none shadow-sm hover:shadow-md transition-all rounded-[1.5rem] overflow-hidden group",
                  rdo.status === 'rejected' 
                    ? "bg-red-50/50 dark:bg-red-950/20 ring-1 ring-red-100 dark:ring-red-900/30" 
                    : "bg-white dark:bg-slate-900 ring-1 ring-slate-100 dark:ring-slate-800"
              )}>
                <CardContent className="p-5 flex items-center gap-4">
                  <div className={cn(
                      "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110",
                      rdo.status === 'rejected' ? "bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400" : "bg-orange-100 dark:bg-orange-900/50 text-orange-600 dark:text-orange-400"
                  )}>
                    {rdo.status === 'rejected' ? <AlertTriangle className="w-6 h-6" /> : <FileClock className="w-6 h-6" />}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1 truncate">
                      {rdo.obra_nome}
                    </p>
                    <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100 truncate">
                      RDO {format(parseISO(rdo.data_rdo), "dd/MM/yy")}
                    </h4>
                    <div className="flex items-center gap-2 mt-1.5">
                      <Badge className={cn(
                          "text-[8px] font-black uppercase px-2 py-0.5 border-none",
                          rdo.status === 'rejected' ? "bg-red-500 text-white" : "bg-orange-500 text-white"
                      )}>
                          {rdo.status === 'rejected' ? 'Correção Requerida' : 'Aguardando Cliente'}
                      </Badge>
                    </div>
                  </div>

                  <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-primary transition-colors" />
                </CardContent>
              </Card>
            }
          />
        ))}
      </div>
    </div>
  );
};

export default RdoActionCenter;