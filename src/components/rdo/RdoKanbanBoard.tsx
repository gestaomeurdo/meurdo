import { useMemo, useState } from "react";
import { DiarioObra } from "@/hooks/use-rdo";
import { format, parseISO } from "date-fns";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sun, Cloud, CloudRain, CloudLightning, Calendar, AlertTriangle } from "lucide-react";
import RdoDialog from "./RdoDialog";
import { useIsMobile } from "@/hooks/use-mobile";

interface RdoKanbanBoardProps {
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

const getClimaIcon = (climaString: string | null) => {
    if (!climaString) return Cloud;
    if (climaString.includes('Chuva Forte')) return CloudLightning;
    if (climaString.includes('Chuva')) return CloudRain;
    if (climaString.includes('Nublado')) return Cloud;
    if (climaString.includes('Sol')) return Sun;
    return Cloud;
};

// Simplified groups based on string content
const getStatusGroup = (status: string) => {
    if (status.includes("Não Praticável")) return "Finalizado"; // Using Finalizado for "Problematic/Stopped"
    if (status.includes("Operacional")) return "Em Aberto";
    return "Em Revisão"; // Fallback
};

const RdoKanbanBoard = ({ rdoList, obraId, isLoading }: RdoKanbanBoardProps) => {
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState<'Em Aberto' | 'Em Revisão' | 'Finalizado'>('Em Aberto');

  const groupedRdos = useMemo(() => {
    const groups: Record<string, DiarioObra[]> = {
      'Em Aberto': [],
      'Em Revisão': [],
      'Finalizado': [],
    };

    rdoList.forEach(rdo => {
      const group = getStatusGroup(rdo.status_dia);
      groups[group].push(rdo);
    });

    return groups;
  }, [rdoList]);

  const getPhotoUrl = (rdo: DiarioObra): string | null => {
    return rdo.rdo_atividades_detalhe?.find(a => a.foto_anexo_url)?.foto_anexo_url || null;
  };

  const getTotalWorkforce = (rdo: DiarioObra): number => {
    return rdo.rdo_mao_de_obra?.reduce((sum, m) => sum + m.quantidade, 0) || 0;
  };

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/2 animate-pulse"></div>
            <div className="space-y-2">
              {[1, 2].map(j => (
                <div key={j} className="h-20 bg-gray-100 rounded animate-pulse"></div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (isMobile) {
    return (
      <div className="space-y-4">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {(['Em Aberto', 'Em Revisão', 'Finalizado'] as const).map(status => (
            <button
              key={status}
              onClick={() => setActiveTab(status)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
                activeTab === status
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/50'
              }`}
            >
              {status} ({groupedRdos[status].length})
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {groupedRdos[activeTab].map(rdo => {
            const photoUrl = getPhotoUrl(rdo);
            const totalWorkforce = getTotalWorkforce(rdo);
            const ClimaIcon = getClimaIcon(rdo.clima_condicoes);
            const rdoDate = parseISO(rdo.data_rdo);

            return (
              <RdoDialog
                key={rdo.id}
                obraId={obraId}
                date={new Date(rdo.data_rdo + 'T12:00:00')}
                trigger={
                  <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        {photoUrl ? (
                          <img
                            src={photoUrl}
                            alt="RDO activity"
                            className="w-16 h-16 object-cover rounded-lg"
                          />
                        ) : (
                          <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                            <Calendar className="w-8 h-8 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <CardTitle className="text-lg font-semibold">
                              {format(rdoDate, 'dd/MM/yyyy')}
                            </CardTitle>
                            <Badge variant="outline" className="text-xs">
                              {totalWorkforce} Func.
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                            <ClimaIcon className="w-4 h-4" />
                            <span className="truncate max-w-[100px]">{rdo.clima_condicoes?.split(',')[0] || 'N/A'}</span>
                            <span>•</span>
                            <span>{(rdo as any).responsavel || 'N/A'}</span>
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
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-3">
      {(['Em Aberto', 'Em Revisão', 'Finalizado'] as const).map(status => (
        <div key={status} className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              {status === 'Em Aberto' && <AlertTriangle className="w-4 h-4 text-green-500" />}
              {status === 'Em Revisão' && <AlertTriangle className="w-4 h-4 text-yellow-500" />}
              {status === 'Finalizado' && <AlertTriangle className="w-4 h-4 text-red-500" />}
              {status}
            </h3>
            <Badge variant="secondary">{groupedRdos[status].length}</Badge>
          </div>

          <div className="space-y-3">
            {groupedRdos[status].map(rdo => {
              const photoUrl = getPhotoUrl(rdo);
              const totalWorkforce = getTotalWorkforce(rdo);
              const ClimaIcon = getClimaIcon(rdo.clima_condicoes);
              const rdoDate = parseISO(rdo.data_rdo);

              return (
                <RdoDialog
                  key={rdo.id}
                  obraId={obraId}
                  date={new Date(rdo.data_rdo + 'T12:00:00')}
                  trigger={
                    <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                      {photoUrl && (
                        <div className="h-32 overflow-hidden">
                          <img
                            src={photoUrl}
                            alt="RDO activity"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg font-semibold">
                              {format(rdoDate, 'dd/MM/yyyy')}
                            </CardTitle>
                            <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                              <ClimaIcon className="w-4 h-4" />
                              <span className="truncate max-w-[120px]">{rdo.clima_condicoes?.split(',')[0] || 'N/A'}</span>
                              <span>•</span>
                              <span>{(rdo as any).responsavel || 'N/A'}</span>
                            </div>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {totalWorkforce} Func.
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  }
                />
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default RdoKanbanBoard;