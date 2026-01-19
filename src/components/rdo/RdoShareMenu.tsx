"use client";

import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Share2, Link2, Mail, MessageSquare, CheckCircle2 } from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";
import { useRequestRdoApproval } from "@/hooks/use-rdo";

interface RdoShareMenuProps {
  obraId: string;
  obraNome: string;
  approvalToken?: string;
  isEditing: boolean;
  isApproved: boolean;
  rdoId?: string;
  rdoDate?: string;
}

const RdoShareMenu = ({ obraId, obraNome, approvalToken, isEditing, isApproved, rdoId }: RdoShareMenuProps) => {
  const requestApprovalMutation = useRequestRdoApproval();
  
  const shareLink = useMemo(() => {
    if (!approvalToken) return "";
    return `${window.location.origin}/rdo/share/${approvalToken}`;
  }, [approvalToken]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareLink);
    showSuccess("Link copiado!");
  };

  const handleSendWhatsApp = async () => {
    if (!rdoId) return;
    try {
      await requestApprovalMutation.mutateAsync({ id: rdoId, obraId });
      const message = encodeURIComponent(`Olá! Segue o RDO da obra *${obraNome}* para sua conferência e assinatura digital:\n\n🔗 ${shareLink}`);
      window.open(`https://wa.me/?text=${message}`, '_blank');
      showSuccess("Solicitação enviada!");
    } catch (err) {
      showError("Erro ao processar solicitação.");
    }
  };

  const handleSendEmail = () => {
    const subject = encodeURIComponent(`Diário de Obra: ${obraNome}`);
    const body = encodeURIComponent(`Olá,\n\nSegue o link para visualização e assinatura digital do Diário de Obra:\n\n${shareLink}`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          disabled={!isEditing}
          className="flex-1 sm:flex-none rounded-xl h-12 font-bold uppercase text-[10px] tracking-widest border-slate-300"
        >
          {isApproved ? <CheckCircle2 className="w-4 h-4 mr-2 text-green-600" /> : <Share2 className="w-4 h-4 mr-2" />}
          {isApproved ? "Ver Aprovação" : "Solicitar Aprovação"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 rounded-xl shadow-xl">
        <DropdownMenuLabel className="text-[10px] font-black uppercase text-slate-400">Opções de Envio</DropdownMenuLabel>
        <DropdownMenuItem onClick={handleSendWhatsApp} className="gap-2 cursor-pointer focus:bg-green-50 focus:text-green-700">
          <MessageSquare className="w-4 h-4 text-green-500" /> 
          <span className="font-bold">WhatsApp</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleCopyLink} className="gap-2 cursor-pointer">
          <Link2 className="w-4 h-4 text-slate-500" /> Copiar Link
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleSendEmail} className="gap-2 cursor-pointer">
          <Mail className="w-4 h-4 text-slate-500" /> Enviar por E-mail
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default RdoShareMenu;