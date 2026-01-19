"use client";

import { Button } from "@/components/ui/button";
import { DollarSign, FileDown, Loader2, Save, Check, Lock, Send, Copy, AlertCircle } from "lucide-react";
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
  onCopyPrevious?: () => void;
}

const RdoHeader = ({ 
  estimatedDailyCost, currentStatus, statusConfig, isApproved, isEditing, 
  obraId, obraNome, approvalToken, rdoId, initialData, profile, selectedObra, rdoList, isPending,
  onCopyPrevious
}: RdoHeaderProps) => {
  const { handleSubmit } = useFormContext();
  const resubmitMutation = useResubmitRdo();

  const isRejected = currentStatus === 'rejected';

  const handleResubmit = async () => {
    if (!rdoId) return;
    await handleSubmit(async () => {
        try {
            await resubmitMutation.mutateAsync({ id: rdoId, obraId });
            showSuccess("RDO reenviado com sucesso!");
        } catch (err) {
            showError("Falha ao reenviar RDO.");
        }
    })();
  };

  return (
    <div className="space-y-4">
      <div className={cn("flex flex-col sm:flex-row justify-between items-start sm:items-center p-6 bg-card border rounded-[2rem] shadow-sm gap-4 border-l-8 transition-all", statusConfig.border)}>
        <div className="flex items-center gap-4">
          <div className={cn("p-3.5 rounded-2xl transition-all", isApproved ? "bg-emerald-100" : "bg-primary/10")}>
            {isApproved ? <Check className="w-8 h-8 text-emerald-600" /> : <DollarSign className="w-8 h-8 text-primary" />}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Badge className={cn("text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5", statusConfig.bg, statusConfig.text)}>
                {statusConfig.label}
              </Badge>
              {isRejected && <AlertCircle className="w-3.5 h-3.5 text-red-500 animate-pulse" />}
            </div>
            <div className="flex items-baseline gap-2">
                <h2 className="text-3xl font-black tracking-tighter text-foreground">{formatCurrency(estimatedDailyCost)}</h2>
                <span className="text-[10px] font-bold text-muted-foreground uppercase">Estimado/Dia</span>
            </div>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          {/* Botão Copiar Anterior - Apenas se estiver criando um novo ou rascunho */}
          {!isApproved && onCopyPrevious && (
            <Button 
                type="button" 
                variant="outline" 
                onClick={onCopyPrevious}
                className="flex-1 sm:flex-none rounded-xl h-12 font-black uppercase text-[9px] tracking-widest border-primary/20 text-primary hover:bg-primary/5"
            >
                <Copy className="w-3.5 h-3.5 mr-2" /> Copiar Anterior
            </Button>
          )}

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
            className="flex-1 sm:flex-none rounded-xl h-12 font-black uppercase text-[9px] tracking-widest"
          >
            <FileDown className="w-4 h-4 mr-2" /> PDF
          </Button>

          {isApproved ? (
            <div className="flex items-center justify-center bg-slate-100 text-slate-400 px-6 rounded-xl h-12 border font-black uppercase text-[9px] tracking-widest gap-2">
              <Lock className="w-3.5 h-3.5" /> RDO Travado
            </div>
          ) : isRejected ? (
            <Button 
              type="button" 
              onClick={handleResubmit}
              disabled={isPending || resubmitMutation.isPending} 
              className="flex-1 sm:flex-none rounded-xl bg-orange-600 hover:bg-orange-700 text-white h-12 font-black uppercase text-[9px] tracking-widest shadow-lg shadow-orange-500/20"
            >
              {isPending || resubmitMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
              Reenviar Ajustes
            </Button>
          ) : (
            <Button type="submit" disabled={isPending} className="flex-1 sm:flex-none rounded-xl bg-[#066abc] hover:bg-[#066abc]/90 h-12 font-black uppercase text-[9px] tracking-widest shadow-lg shadow-blue-500/20">
              {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Salvar Diário
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default RdoHeader;