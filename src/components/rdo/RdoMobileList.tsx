import { DiarioObra } from "@/hooks/use-rdo";
import { format, parseISO } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sun, Cloud, CloudRain, CloudLightning, Users, Calendar } from "lucide-react";
import RdoDialog from "./RdoDialog";
import { formatCurrency } from "@/utils/formatters";

interface RdoMobileListProps {
  rdoList: DiarioObra[];
  obraId: string;
  isLoading: boolean;
}

const climaIconMap: Record<string, React.ElementType> = {
  'Sol': Sun,
  'Nublado': Cloud,
  'Chuva Leve': CloudRain,
  'Chuva Forte': CloudLightning,
};

const RdoMobileList = ({ rdoList, obraId, isLoading }: RdoMobileListProps) => {
  const getDailyCost = (rdo: DiarioObra): number => {
    return rdo.rdo_mao_de_obra?.reduce((sum, m) => sum + (m.quantidade * (m.custo_unitario || 0)), 0) || 0;
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map(i => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                    <div className="h-3 bg-gray-200 rounded w-16"></div>
                  </div>
                </div>
                <div className="h-6 bg-gray-200 rounded w-16"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {rdoList.map(rdo => {
        const dailyCost = getDailyCost(rdo);
        const ClimaIcon = rdo.clima_condicoes ? climaIconMap[rdo.clima_condicoes] : Cloud;
        const rdoDate = parseISO(rdo.data_rdo);

        return (
          <RdoDialog
            key={rdo.id}
            obraId={obraId}
            date={new Date(rdo.data_rdo + 'T12:00:00')}
            trigger={
              <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex flex-col items-center justify-center">
                        <span className="text-xl font-bold text-primary">{format(rdoDate, 'dd')}</span>
                        <ClimaIcon className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <div className="font-semibold">
                          {(rdo as any).responsavel || 'N/A'}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {rdo.status_dia}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-lg">
                        {formatCurrency(dailyCost)}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            }
          />
        );
      })}
    </div>
  );
};

export default RdoMobileList;