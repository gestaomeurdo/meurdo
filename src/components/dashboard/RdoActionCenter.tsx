"use client";

import { DiarioObra } from "@/hooks/use-rdo";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, AlertCircle, MessageSquare, CheckCircle2, ChevronRight, Share2 } from "lucide-react";
import { formatDate } from "@/utils/formatters";
import { cn } from "@/lib/utils";
import RdoDialog from "../rdo/RdoDialog";

interface RdoActionCenterProps {
  rdos: (DiarioObra & { obra_nome: string })[];
  isLoading: boolean;
}

const RdoActionCenter = ({ rdos, isLoading }: RdoActionCenterProps) => {
  if (isLoading) return null;

  const handleNudge = (rdo: any) => {
    const shareLink = `${window.location.origin}/rdo/share/${rdo.approval_token}`;
    const message = encodeURIComponent(`Olá! Estou passando para lembrar da conferência do RDO de *${rdo.obra_nome}* referente ao dia *${formatDate(rdo.data_rdo)}*.\n\nVocê pode assinar aqui: ${shareLink}`);
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  if (rdos.length === 0) {
    return (
      <Card className="border-none shadow-sm bg-emerald-500/5 ring-1 ring-emerald-500/20 rounded-[2rem] overflow-hidden">
        <CardContent className="p-8 flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
          <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center shrink-0 shadow-inner">
            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
          </div>
          <div>
            <h3 className="text-xl font-black text-emerald-900 uppercase tracking-tight leading-none mb-1">Tudo em dia!</h3>
            <p className="text-sm text-emerald-700 font-medium opacity-80">
              Todos os seus diários enviados foram aprovados ou estão em rascunho.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-2">
        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-orange-500" /> Status de Aprovações
        </h3>
        <Badge variant="secondary" className="text-[10px] font-black">{rdos.length} pendência(s)</Badge>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {rdos.map((rdo) => {
          const isRejected = rdo.status === 'rejected';
          return (
            <Card key={rdo.id} className={cn(
                "border-none shadow-clean rounded-2xl overflow-hidden transition-all hover:translate-x-1",
                isRejected ? "bg-red-50/30" : "bg-white"
            )}>
              <div className={cn("absolute left-0 top-0 h-full w-1.5", isRejected ? "bg-red-500" : "bg-orange-500")}></div>
              <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex-1 space-y-1">
                  <h4 className="font-black text-sm uppercase tracking-tight text-slate-800">
                    {rdo.obra_nome}
                  </h4>
                  <p className="text-xs text-slate-500 font-medium">
                    Referente a: <span className="font-bold">{formatDate(rdo.data_rdo)}</span>
                  </p>
                  <div className="flex gap-2 pt-1">
                    {isRejected ? (
                        <Badge className="bg-red-100 text-red-700 border-red-200 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 shadow-none">
                            <AlertCircle className="w-2.5 h-2.5 mr-1" /> Requer Correção
                        </Badge>
                    ) : (
                        <Badge className="bg-orange-100 text-orange-700 border-orange-200 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 shadow-none">
                            <Clock className="w-2.5 h-2.5 mr-1" /> Aguardando Cliente
                        </Badge>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <RdoDialog 
                        obraId={rdo.obra_id} 
                        date={new Date(rdo.data_rdo + 'T12:00:00')} 
                        trigger={
                            <Button variant="outline" size="sm" className="flex-1 sm:flex-none rounded-xl h-10 font-bold uppercase text-[9px] tracking-widest">
                                {isRejected ? "Ver Motivo" : "Abrir RDO"}
                            </Button>
                        }
                    />
                    <Button 
                        size="sm"
                        onClick={() => handleNudge(rdo)}
                        className={cn(
                            "flex-1 sm:flex-none h-10 rounded-xl font-black uppercase text-[9px] tracking-widest shadow-lg",
                            isRejected ? "bg-[#066abc] text-white" : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20"
                        )}
                    >
                        {isRejected ? <ChevronRight className="w-3 h-3 mr-1" /> : <MessageSquare className="w-3 h-3 mr-1" />}
                        {isRejected ? "Corrigir" : "Cobrar Cliente"}
                    </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default RdoActionCenter;