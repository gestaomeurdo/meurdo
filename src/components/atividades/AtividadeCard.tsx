"use client";

import { Atividade } from "@/hooks/use-atividades";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, User, MoreVertical, Edit, Trash2 } from "lucide-react";
import { formatDate } from "@/utils/formatters";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import AtividadeDialog from "./AtividadeDialog";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

interface AtividadeCardProps {
  atividade: Atividade;
  onDelete: (id: string) => void;
  isSelected?: boolean;
  onSelect?: (id: string, checked: boolean) => void;
}

const AtividadeCard = ({ atividade, onDelete, isSelected, onSelect }: AtividadeCardProps) => {
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
      <CardContent className={cn("p-4 pt-0 space-y-4", onSelect && "pl-12")}>
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center text-xs text-muted-foreground">
            <User className="w-3 h-3 mr-1.5 text-primary" />
            <span className="truncate">{atividade.responsavel_nome || "Não definido"}</span>
          </div>
          <div className="flex items-center text-xs text-muted-foreground justify-end">
            <Calendar className="w-3 h-3 mr-1.5" />
            <span>Previsão: {atividade.data_prevista ? formatDate(atividade.data_prevista) : "N/A"}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AtividadeCard;