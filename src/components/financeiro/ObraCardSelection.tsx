"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Obra } from "@/hooks/use-obras";
import { Construction, MapPin, Calendar, CheckCircle2, Clock, AlertCircle, DollarSign, ArrowRight } from "lucide-react";
import { formatCurrency, formatDate } from "@/utils/formatters";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ObraCardSelectionProps {
  obra: Obra;
  onClick: (id: string) => void;
}

const statusConfig = {
  ativa: { icon: Clock, label: "Em Andamento", color: "bg-green-500/10 text-green-600 border-green-200" },
  concluida: { icon: CheckCircle2, label: "Concluída", color: "bg-blue-500/10 text-blue-600 border-blue-200" },
  pausada: { icon: AlertCircle, label: "Pausada", color: "bg-yellow-500/10 text-yellow-600 border-yellow-200" },
};

const ObraCardSelection = ({ obra, onClick }: ObraCardSelectionProps) => {
  const status = statusConfig[obra.status] || statusConfig.ativa;

  return (
    <Card 
      className="group cursor-pointer overflow-hidden border-2 border-border/50 hover:border-primary transition-all duration-300 shadow-sm hover:shadow-2xl bg-card"
      onClick={() => onClick(obra.id)}
    >
      <CardContent className="p-0">
        <div className="flex flex-col h-full">
          {/* Top Banner with Icon and Status */}
          <div className="relative p-6 bg-secondary/30 flex items-start justify-between">
            <div className="bg-background p-4 rounded-2xl shadow-sm border border-border group-hover:scale-110 transition-transform duration-500">
              <Construction className="w-10 h-10 text-primary" />
            </div>
            <Badge className={cn("px-3 py-1 border font-semibold", status.color)}>
              <status.icon className="w-3.5 h-3.5 mr-1.5" />
              {status.label}
            </Badge>
          </div>

          {/* Main Content */}
          <div className="p-6 space-y-5">
            <div className="space-y-1">
              <h3 className="text-2xl font-bold text-foreground leading-tight group-hover:text-primary transition-colors">
                {obra.nome}
              </h3>
              <div className="flex items-start text-muted-foreground">
                <MapPin className="w-4 h-4 mr-2 mt-1 shrink-0 text-primary/70" />
                <span className="text-sm font-medium leading-relaxed">
                  {obra.endereco || "Endereço não cadastrado"}
                </span>
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 gap-4 py-4 border-y border-border/50">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider flex items-center">
                  <Calendar className="w-3 h-3 mr-1" /> Início
                </span>
                <p className="text-sm font-semibold">{formatDate(obra.data_inicio)}</p>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider flex items-center">
                  <DollarSign className="w-3 h-3 mr-1" /> Orçamento
                </span>
                <p className="text-sm font-bold text-primary">{formatCurrency(obra.orcamento_inicial)}</p>
              </div>
            </div>

            {/* Details and Footer */}
            <div className="flex items-center justify-between pt-2">
              <div className="text-xs text-muted-foreground">
                Responsável: <span className="font-semibold text-foreground">{obra.responsavel_tecnico || "N/A"}</span>
              </div>
              <div className="bg-primary/10 text-primary p-2 rounded-full group-hover:translate-x-1 transition-transform">
                <ArrowRight className="w-5 h-5" />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ObraCardSelection;