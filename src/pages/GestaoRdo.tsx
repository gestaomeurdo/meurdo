import DashboardLayout from "@/components/layout/DashboardLayout";
import { useObras } from "@/hooks/use-obras";
import { useState, useEffect, useMemo } from "react";
import { Loader2, FileText, Plus, CloudRain, Users, Calendar as CalendarIcon, ClipboardCheck, Info } from "lucide-react";
import ObraSelector from "@/components/financeiro/ObraSelector";
import RdoDialog from "@/components/rdo/RdoDialog";
import { Button } from "@/components/ui/button";
import { useRdoList, DiarioObra } from "@/hooks/use-rdo";
import RdoListTable from "@/components/rdo/RdoListTable";
import KpiCard from "@/components/relatorios/KpiCard";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const GestaoRdo = () => {
  const { data: obras, isLoading: isLoadingObras, isError: isErrorObras } = useObras();
  const [selectedObraId, setSelectedObraId] = useState<string | undefined>(undefined);
  const today = useMemo(() => new Date(), []);

  useEffect(() => {
    if (obras && obras.length > 0 && !selectedObraId) {
      setSelectedObraId(obras[0].id);
    }
  }, [obras, selectedObraId]);

  const selectedObra = obras?.find(o => o.id === selectedObraId);
  
  const { data: rdoList, isLoading: isLoadingRdoList } = useRdoList(selectedObraId || '');

  // --- Summary Metrics ---
  const lastRdo = rdoList && rdoList.length > 0 ? rdoList[0] : null;

  const summaryMetrics = useMemo(() => {
    if (!rdoList) return { daysWorked: 0, daysOfRain: 0 };

    const currentMonth = format(today, 'yyyy-MM');
    let daysWorked = 0;
    let daysOfRain = 0;
    
    rdoList.forEach(rdo => {
      const rdoMonth = format(parseISO(rdo.data_rdo), 'yyyy-MM');
      if (rdoMonth === currentMonth) {
        daysWorked++;
        if (rdo.clima_condicoes?.includes('Chuva')) {
          daysOfRain++;
        }
      }
    });

    return { daysWorked, daysOfRain };
  }, [rdoList, today]);

  if (isLoadingObras) {
    return (
      <DashboardLayout>
        <div className="p-6 flex flex-col justify-center items-center h-[60vh]">
          <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground animate-pulse">Carregando suas obras...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Gestão de RDO</h1>
            <p className="text-muted-foreground">Relatórios Diários de Obra e acompanhamento de campo.</p>
          </div>
          <div className="flex flex-wrap gap-3 items-center">
            <ObraSelector 
              selectedObraId={selectedObraId} 
              onSelectObra={setSelectedObraId} 
            />
            {selectedObraId && (
              <RdoDialog 
                obraId={selectedObraId} 
                date={today} 
                trigger={
                  <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-lg">
                    <Plus className="w-5 h-5 mr-2" />
                    Novo RDO (Hoje)
                  </Button>
                }
              />
            )}
          </div>
        </div>

        {!selectedObraId ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center py-12">
              <Construction className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Selecione uma obra para gerenciar os diários.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Visual Summary of the Latest RDO */}
            {lastRdo && (
              <Card className="border-primary/20 bg-primary/5">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg flex items-center">
                      <ClipboardCheck className="w-5 h-5 mr-2 text-primary" />
                      Último Registro: {format(parseISO(lastRdo.data_rdo), "dd 'de' MMMM", { locale: ptBR })}
                    </CardTitle>
                    <Badge variant={lastRdo.status_dia === 'Operacional' ? 'default' : 'destructive'}>
                      {lastRdo.status_dia}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center">
                      <CloudRain className="w-4 h-4 mr-2 text-muted-foreground" />
                      <span className="font-medium mr-1">Clima:</span> {lastRdo.clima_condicoes || 'N/A'}
                    </div>
                    <div className="flex items-center">
                      <Users className="w-4 h-4 mr-2 text-muted-foreground" />
                      <span className="font-medium mr-1">Equipe:</span> Ver detalhes na lista abaixo
                    </div>
                    <div className="flex items-center">
                      <Info className="w-4 h-4 mr-2 text-muted-foreground" />
                      <span className="font-medium mr-1">Obs:</span> {lastRdo.observacoes_gerais ? 'Contém observações' : 'Sem observações'}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* KPI Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <KpiCard
                title="Dias Trabalhados (Mês)"
                value={summaryMetrics.daysWorked}
                description={`Total de RDOs em ${format(today, 'MMMM', { locale: ptBR })}.`}
                icon={FileText}
                isLoading={isLoadingRdoList}
              />
              <KpiCard
                title="Dias de Chuva"
                value={summaryMetrics.daysOfRain}
                description="Ocorrências de chuva registradas."
                icon={CloudRain}
                isLoading={isLoadingRdoList}
              />
              <KpiCard
                title="Status Atual"
                value={selectedObra?.status === 'ativa' ? 'Em Obra' : 'Parado'}
                description="Status geral da obra selecionada."
                icon={Users}
                isLoading={false}
              />
              <KpiCard
                title="Responsável Logado"
                value="Você"
                description="Seus registros aparecem com seu nome."
                icon={Users}
                isLoading={false}
              />
            </div>

            {/* RDO List Table */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold flex items-center">
                <CalendarIcon className="w-5 h-5 mr-2" />
                Histórico de Diários
              </h3>
              <RdoListTable 
                rdoList={rdoList || []} 
                obraId={selectedObraId} 
                isLoading={isLoadingRdoList} 
              />
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

import { Construction } from "lucide-react";

export default GestaoRdo;