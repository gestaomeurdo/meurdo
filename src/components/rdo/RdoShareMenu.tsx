"use client";

import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Share2, Link2, Mail, MessageSquare, CheckCircle2, Lock } from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";
import { useRequestRdoApproval } from "@/hooks/use-rdo";
import { useAuth } from "@/integrations/supabase/auth-provider";
import UpgradeModal from "../subscription/UpgradeModal";
import { useState } from "react";

interface RdoShareMenuProps {
  obraId: string;
  obraNome: string;
  approvalToken?: string;
  isEditing: boolean;
  isApproved: boolean;
  rdoId?: string;
}

const RdoShareMenu = ({ obraId, obraNome, approvalToken, isEditing, isApproved, rdoId }: RdoShareMenuProps) => {
  const { isPro } = useAuth();
  const [showUpgrade, setShowUpgrade] = useState(false);
  const requestApprovalMutation = useRequestRdoApproval();
  
  const shareLink = useMemo(() => {
    if (!approvalToken) return "";
    return `${window.location.origin}/rdo/share/${approvalToken}`;
  }, [approvalToken]);

  const handleAction = (callback: () => void) => {
    if (!isPro) {
        setShowUpgrade(true);
        return;
    }
    callback();
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareLink);
    showSuccess("Link copiado!");
  };

  const handleSendWhatsApp = async () => {
    if (!rdoId) return;
    try {
      await requestApprovalMutation.mutateAsync({ id: rdoId, obraId });
      const message = encodeURIComponent(`Olá! Segue o RDO da obra *${obraNome}* para conferência:\n\n🔗 ${shareLink}`);
      window.open(`https://wa.me/?text=${message}`, '_blank');
    } catch (err) {
      showError("Erro ao processar.");
    }
  };

  return (
    <>
        <UpgradeModal open={showUpgrade} onOpenChange={setShowUpgrade} title="Aprovação Digital Protegida" description="Assinaturas digitais e links de compartilhamento são exclusivos do Plano PRO." />
        
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
                <DropdownMenuItem onClick={() => handleAction(handleSendWhatsApp)} className="gap-2 cursor-pointer">
                    <MessageSquare className="w-4 h-4 text-green-500" /> 
                    <span className="font-bold">WhatsApp</span>
                    {!isPro && <Lock className="w-3 h-3 ml-auto text-slate-400" />}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleAction(handleCopyLink)} className="gap-2 cursor-pointer">
                    <Link2 className="w-4 h-4 text-slate-500" /> 
                    <span>Copiar Link</span>
                    {!isPro && <Lock className="w-3 h-3 ml-auto text-slate-400" />}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    </>
  );
};

export default RdoShareMenu;