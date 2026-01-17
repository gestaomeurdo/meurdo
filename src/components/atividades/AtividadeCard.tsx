"use client";

import { Atividade } from "@/hooks/use-atividades";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Calendar, User, Clock, MoreVertical, Edit, Trash2, CheckCircle2 } from "lucide-react";
import { formatDate } from "@/utils/formatters";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import AtividadeDialog from "./AtividadeDialog";
import { isAfter, parseISO } from "date-fns";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

interface AtividadeCardProps {
  atividade: Atividade;
  onDelete: (id: string) => void;
  isSelected?: boolean;
  onSelect?: (id: string, checked: boolean) => void;
}

const AtividadeCard = ({ atividade, onDelete, isSelected, onSelect }: AtividadeCardProps) => {
  const getStatusInfo = () => {
    const today = new Date();
    const prevista = atividade.data_prevista ? parseISO(atividade.data_prevista) : null;
    const concluida = atividade.progresso_atual === 100;
    
    if (concluida) return { label: "Concluída", color: "bg-blue-500" };
    if (atividade.status === 'Pausada') return { label: "Pausada", color: "bg-gray-400" };
    if (prevista && isAfter(today, prevista)) return { label: "Atrasada", color: "bg-destructive" };
    
    return { label: "No Prazo", color: "bg-green-600" };
  };

  const status = getStatusInfo();

  return (
    <Card className={cn(
      "shadow-clean hover:shadow-md transition-all border-none overflow-hidden group relative",
      isSelected && "ring-2 ring-primary bg-primary/5"
    )}>
      <div className={`h-1.5 w-full ${status.color}`}></div>
      
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

        <div className="space-y-1.5">
          <div className="flex justify-between items-end">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Progresso</span>
            <span className="text-sm font-black text-primary">{atividade.progresso_atual}%</span>
          </div>
          <Progress 
            value={atividade.progresso_atual} 
            className="h-2 bg-muted" 
            indicatorClassName="bg-[#066abc]"
          />
        </div>

        <div className="pt-2 flex justify-between items-center border-t border-muted/50">
          <div className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${status.color}`}></div>
            <span className="text-[10px] font-black uppercase tracking-widest">{status.label}</span>
          </div>
          <Button variant="link" size="sm" className="h-auto p-0 text-[10px] font-bold text-primary" asChild>
            <a href="/gestao-rdo">ATUALIZAR NO RDO</a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AtividadeCard;