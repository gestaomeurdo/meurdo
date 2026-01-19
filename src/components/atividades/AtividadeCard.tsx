"use client";

import { Atividade } from "@/hooks/use-atividades";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, MoreVertical, Edit, Trash2, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import AtividadeDialog from "./AtividadeDialog";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

interface AtividadeCardProps {
  atividade: Atividade;
  onDelete: (id: string) => void;
  isSelected?: boolean;
  onSelect?: (id: string, checked: boolean) => void;
}

const AtividadeCard = ({ atividade, onDelete, isSelected, onSelect }: AtividadeCardProps) => {
  const progress = atividade.progresso_atual || 0;

  return (
    <Card className={cn(
      "shadow-clean hover:shadow-md transition-all border-none overflow-hidden group relative",
      isSelected && "ring-2 ring-primary bg-primary/5"
    )}>
      
      {onSelect && (
        <div className="absolute top-4 left-4 z-10">
          <Checkbox 
            checked={isSelected} 
            onCheckedChange={(checked) => onSelect(atividade.id, !!checked)} 
            className="h-5 w-5 bg-white data-[state=checked]:bg-primary"
          />
        </div>
      )}

      <CardHeader className={cn("p-4 pb-2", onSelect && "pl-12")}>
        <div className="flex justify-between items-start">
          <Badge variant="outline" className="text-[10px] uppercase font-bold text-muted-foreground border-muted-foreground/20">
            {atividade.etapa || "Sem Etapa"}
          </Badge>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <AtividadeDialog obraId={atividade.obra_id} initialData={atividade} trigger={
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                  <Edit className="w-4 h-4 mr-2" /> Editar Atividade
                </DropdownMenuItem>
              } />
              <DropdownMenuItem onClick={() => onDelete(atividade.id)} className="text-destructive">
                <Trash2 className="w-4 h-4 mr-2" /> Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <CardTitle className="text-lg font-bold leading-tight pt-1">
          {atividade.descricao}
        </CardTitle>
      </CardHeader>
      <CardContent className={cn("p-4 pt-0 space-y-3", onSelect && "pl-12")}>
        <div className="flex items-center text-xs text-muted-foreground">
            <User className="w-3 h-3 mr-1.5 text-primary" />
            <span className="truncate">{atividade.responsavel_nome || "Responsável não definido"}</span>
        </div>
        
        <div className="space-y-1 pt-1">
            <div className="flex justify-between text-xs font-bold">
                <span className="flex items-center text-primary"><TrendingUp className="w-3 h-3 mr-1" /> Progresso</span>
                <span className="text-primary">{progress}%</span>
            </div>
            <Progress value={progress} className="h-1.5" />
        </div>
      </CardContent>
    </Card>
  );
};

export default AtividadeCard;