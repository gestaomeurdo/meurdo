"use client";

import { Button } from "@/components/ui/button";
import { DollarSign, FileDown, Loader2, Save, Check, Lock, Send } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/utils/formatters";
import RdoShareMenu from "./RdoShareMenu";
import { cn } from "@/lib/utils";
import { DiarioObra, useResubmitRdo } from "@/hooks/use-rdo";
import { generateRdoPdf } from "@/utils/rdo-pdf";
import { Profile } from "@/hooks/use-profile";
import { Obra } from "@/hooks/use-obras";
import { useFormContext } from "react-hook-form";
import { showSuccess, showError } from "@/utils/toast";

interface RdoHeaderProps {
  estimatedDailyCost: number;
  currentStatus: string;
  statusConfig: any;
  isApproved: boolean;
  isEditing: boolean;
  obraId: string;
  obraNome: string;
  approvalToken?: string;
  rdoId?: string;
  initialData?: DiarioObra;
  profile: Profile | null;
  selectedObra?: Obra;
  rdoList?: DiarioObra[];
  isPending: boolean;
}

const RdoHeader = ({ 
  estimatedDailyCost, currentStatus, statusConfig, isApproved, isEditing, 
  obraId, obraNome, approvalToken, rdoId, initialData, profile, selectedObra, rdoList, isPending 
}: RdoHeaderProps) => {
  const { handleSubmit } = useFormContext();
  const resubmitMutation = useResubmitRdo();

  const isRejected = currentStatus === 'rejected';

  // Lógica para salvar e reenviar automaticamente
  const handleResubmit = async () => {
    if (!rdoId) return;
    
    // Primeiro salva as alterações via form
    await handleSubmit(async () => {
        try {
            // Após salvar, dispara a mudança de status
            await resubmitMutation.mutateAsync({ id: rdoId, obraId });
            showSuccess("RDO atualizado e reenviado para o cliente!");
        } catch (err) {
            showError("Falha ao reenviar RDO.");
        }
    })();
  };

  return (
    <div className={cn("flex flex-col sm:flex-row justify-between items-start sm:items-center p-5 bg-card border rounded-3xl shadow-clean gap-4 border-l-8", statusConfig.border)}>
      <div className="flex items-center gap-4">
        <div className={cn("p-3 rounded-2xl", isApproved ? "bg-green-100" : "bg-primary/10")}>
          {isApproved ? <Check className="w-7 h-7 text-green-600" /> : <DollarSign className="w-7 h-7 text-primary" />}
        </div>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Gasto Estimado (Dia)</p>
            <Badge className={cn("text-[8px] font-black uppercase", statusConfig.bg, statusConfig.text)}>
              {statusConfig.label}
            </Badge>
          </div>
          <h2 className="text-3xl font-black tracking-tight text-foreground">{formatCurrency(estimatedDailyCost)}</h2>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-2 w-full sm:w-auto">
        <RdoShareMenu 
          obraId={obraId} 
          obraNome={obraNome} 
          approvalToken={approvalToken} 
          isEditing={isEditing} 
          isApproved={isApproved} 
          rdoId={rdoId} 
        />

        <Button 
          type="button" 
          variant="outline" 
          onClick={() => initialData && generateRdoPdf(initialData, obraNome, profile, selectedObra, rdoList)} 
          disabled={!isEditing} 
          className="flex-1 sm:flex-none rounded-xl h-12 font-bold uppercase text-[10px] tracking-widest disabled:opacity-50"
        >
          <FileDown className="w-4 h-4 mr-2" /> PDF
        </Button>

        {isApproved ? (
          <div className="flex items-center justify-center bg-slate-100 text-slate-500 px-6 rounded-xl h-12 border font-black uppercase text-[10px] tracking-widest gap-2">
            <Lock className="w-3 h-3" /> RDO Travado
          </div>
        ) : isRejected ? (
          <Button 
            type="button" 
            onClick={handleResubmit}
            disabled={isPending || resubmitMutation.isPending} 
            className="flex-1 sm:flex-none rounded-xl bg-orange-600 hover:bg-orange-700 text-white h-12 font-bold uppercase text-[10px] tracking-widest shadow-lg shadow-orange-500/20"
          >
            {isPending || resubmitMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
            Salvar e Reenviar
          </Button>
        ) : (
          <Button type="submit" disabled={isPending} className="flex-1 sm:flex-none rounded-xl bg-primary hover:bg-primary/90 h-12 font-bold uppercase text-[10px] tracking-widest shadow-lg shadow-primary/20">
            {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Salvar Registro
          </Button>
        )}
      </div>
    </div>
  );
};

export default RdoHeader;