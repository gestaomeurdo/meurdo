"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Library, Loader2, CheckCircle2, ChevronDown } from "lucide-react";
import { ATIVIDADE_MODELS, AtividadeModel } from "@/utils/atividade-models";
import { useBulkCreateAtividades } from "@/hooks/use-atividades";
import { showSuccess, showError } from "@/utils/toast";

const LOGO_ICON = "https://meurdo.com.br/wp-content/uploads/2026/01/Icone.png";

interface AtividadeModelSelectorProps {
  obraId: string;
  variant?: "default" | "outline" | "ghost";
  className?: string;
}

const AtividadeModelSelector = ({ obraId, variant = "outline", className }: AtividadeModelSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const bulkCreate = useBulkCreateAtividades();

  const handleImport = async (model: AtividadeModel) => {
    try {
      await bulkCreate.mutateAsync({
        obraId,
        atividades: model.atividades
      });
      showSuccess(`Cronograma ${model.nome} importado com sucesso!`);
      setIsOpen(false);
    } catch (error) {
      showError("Erro ao importar modelo.");
    }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
            variant={variant} 
            className={className || "rounded-xl border-dashed hover:bg-primary/5 hover:text-primary transition-all"}
            disabled={bulkCreate.isPending}
        >
          {bulkCreate.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Library className="w-4 h-4 mr-2" />}
          Importar Modelo Padrão
          <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72 rounded-xl shadow-xl border-primary/10">
        <DropdownMenuLabel className="flex items-center justify-between text-xs uppercase tracking-widest text-muted-foreground py-3">
          Modelos Técnicos
          <img src={LOGO_ICON} alt="Selo" className="h-4 w-4 opacity-50" />
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {ATIVIDADE_MODELS.map((model) => (
          <DropdownMenuItem 
            key={model.id} 
            onSelect={() => handleImport(model)}
            className="flex flex-col items-start gap-1 py-4 px-3 cursor-pointer group focus:bg-primary/5"
          >
            <div className="flex items-center justify-between w-full">
              <span className="font-bold text-sm group-hover:text-primary transition-colors">{model.nome}</span>
              <img src={LOGO_ICON} alt="Verificado" className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-all" title="Modelo Verificado Meu RDO" />
            </div>
            <span className="text-[10px] text-muted-foreground leading-tight">
              {model.descricao}
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default AtividadeModelSelector;