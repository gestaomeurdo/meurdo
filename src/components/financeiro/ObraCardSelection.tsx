"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Obra } from "@/hooks/use-obras";
import { Construction, MapPin, ArrowRight, DollarSign } from "lucide-react";
import { formatCurrency } from "@/utils/formatters";

interface ObraCardSelectionProps {
  obra: Obra;
  onClick: (id: string) => void;
}

const ObraCardSelection = ({ obra, onClick }: ObraCardSelectionProps) => {
  return (
    <Card 
      className="group cursor-pointer overflow-hidden border-2 border-transparent hover:border-primary/50 transition-all duration-300 shadow-md hover:shadow-xl bg-card/50 backdrop-blur-sm"
      onClick={() => onClick(obra.id)}
    >
      <CardContent className="p-0">
        <div className="relative h-24 bg-gradient-to-r from-primary/20 to-orange-500/10 flex items-center justify-center">
          <div className="bg-background/80 p-3 rounded-full shadow-sm group-hover:scale-110 transition-transform duration-300">
            <Construction className="w-8 h-8 text-primary" />
          </div>
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
             <ArrowRight className="w-5 h-5 text-primary" />
          </div>
        </div>
        <div className="p-5 space-y-3">
          <div>
            <h3 className="text-xl font-bold truncate group-hover:text-primary transition-colors">{obra.nome}</h3>
            <div className="flex items-center text-sm text-muted-foreground mt-1">
              <MapPin className="w-3 h-3 mr-1 shrink-0" />
              <span className="truncate">{obra.endereco || "Sem endereço"}</span>
            </div>
          </div>
          
          <div className="pt-2 border-t flex justify-between items-center">
             <div className="text-xs uppercase font-semibold text-muted-foreground">Orçamento</div>
             <div className="text-sm font-bold flex items-center text-primary">
                <DollarSign className="w-3 h-3 mr-0.5" />
                {formatCurrency(obra.orcamento_inicial)}
             </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ObraCardSelection;