"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Library, Loader2, Zap, CheckCircle2, ShieldAlert } from "lucide-react";
import { ATIVIDADE_MODELS, AtividadeModel } from "@/utils/atividade-models";
import { useAuth } from "@/integrations/supabase/auth-provider";
import { useBulkCreateAtividades } from "@/hooks/use-atividades";
import { showSuccess, showError } from "@/utils/toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import UpgradeButton from "../subscription/UpgradeButton";

interface AtividadeModelSelectorProps {
  obraId: string;
}

const AtividadeModelSelector = ({ obraId }: AtividadeModelSelectorProps) => {
  const { profile } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const isPro = profile?.subscription_status === 'active';
  const bulkCreate = useBulkCreateAtividades();

  const handleImport = async (model: AtividadeModel) => {
    if (model.isPremium && !isPro) {
      setShowUpgradeModal(true);
      return;
    }

    try {
      await bulkCreate.mutateAsync({
        obraId,
        atividades: model.atividades
      });
      showSuccess(`${model.atividades.length} atividades importadas do modelo ${model.nome}!`);
    } catch (error) {
      showError("Erro ao importar modelo.");
    }
  };

  return (
    <>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="rounded-xl border-dashed">
            {bulkCreate.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Library className="w-4 h-4 mr-2" />}
            Importar Modelo
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64 rounded-xl shadow-xl">
          <DropdownMenuLabel className="flex items-center gap-2">
            Modelos Disponíveis
            {!isPro && <Zap className="w-3 h-3 text-orange-500 fill-orange-500" />}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {ATIVIDADE_MODELS.map((model) => (
            <DropdownMenuItem 
              key={model.id} 
              onSelect={() => handleImport(model)}
              className="flex flex-col items-start gap-1 py-3 cursor-pointer"
            >
              <div className="flex items-center justify-between w-full">
                <span className="font-bold">{model.nome}</span>
                {model.isPremium && !isPro && <Zap className="w-3 h-3 text-orange-500 fill-orange-500" />}
              </div>
              <span className="text-[10px] text-muted-foreground leading-tight">
                {model.descricao}
              </span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={showUpgradeModal} onOpenChange={setShowUpgradeModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-4">
              <Zap className="h-6 w-6 text-orange-600" />
            </div>
            <DialogTitle className="text-center text-xl">Recurso Exclusivo PRO</DialogTitle>
            <DialogDescription className="text-center pt-2">
              Modelos avançados de cronograma (Residencial, Comercial e Reforma) estão disponíveis apenas para membros PRO.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span>Cronogramas técnicos completos</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span>Gestão ilimitada de etapas</span>
              </div>
            </div>
            
            <div className="pt-2">
              <UpgradeButton />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AtividadeModelSelector;