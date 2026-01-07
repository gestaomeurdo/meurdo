import DashboardLayout from "@/components/layout/DashboardLayout";
import { useObras } from "@/hooks/use-obras";
import { useState, useEffect, useMemo } from "react";
import { Loader2, FileText, Plus, CloudRain, Users, ClipboardCheck, LayoutGrid, List, AlertTriangle } from "lucide-react";
import ObraSelector from "@/components/financeiro/ObraSelector";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon } from "lucide-react";
import { DateRange } from "react-day-picker";
import { format, parseISO, isSameMonth } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { useRdoList } from "@/hooks/use-rdo";
import RdoDashboard from "@/components/rdo/RdoDashboard";
import RdoKanbanBoard from "@/components/rdo/RdoKanbanBoard";
import RdoMobileList from "@/components/rdo/RdoMobileList";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useIsMobile } from "@/hooks/use-mobile";
import RdoDialog from "@/components/rdo/RdoDialog";

const GestaoRdo = () => {
  const { data: obras, isLoading: isLoadingObras, error: obrasError } = useObras();
  const [selectedObraId, setSelectedObraId] = useState<string | undefined>(undefined);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'kanban' | 'lista'>('kanban');
  const isMobile = useIsMobile();

  useEffect(() => {
    if (obras && obras.length > 0 && !selectedObraId) {
      setSelectedObraId(obras[0].id);
    }
  }, [obras, selectedObraId]);

  const selectedObra = obras?.find(o => o.id === selectedObraId);
  const { data: rdoList, isLoading: isLoadingRdoList, error: rdoError } = useRdoList(selectedObraId || '');

  const renderContent = () => {
    if (isLoadingObras) {
      return (
        <div className="flex flex-col justify-center items-center h-[60vh] gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-muted-foreground animate-pulse">Carregando obras...</p>
        </div>
      );
    }

    if (!selectedObraId) {
      return (
        <Card className="border-dashed py-20 text-center">
          <CardContent>
            <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Selecione uma obra para gerenciar os RDOs.</p>
          </CardContent>
        </Card>
      );
    }

    if (rdoError) {
      return (
        <Alert variant="destructive" className="mt-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Erro ao carregar RDOs</AlertTitle>
          <AlertDescription>
            Ocorreu um erro ao buscar os dados. Verifique as permissões (RLS) ou a conexão.
            <p className="mt-2 text-sm italic">Detalhe: {rdoError.message}</p>
          </AlertDescription>
        </Alert>
      );
    }

    return (
      <div className="space-y-6">
        {/* Dashboard View */}
        <RdoDashboard
          rdoList={rdoList || []}
          currentDate={currentDate}
          isLoading={isLoadingRdoList}
        />

        {/* View Toggle */}
        <div className="flex justify-between items-center">
          <div className="bg-card border rounded-xl p-1 inline-flex">
            <Button
              variant={view === "kanban" ? "secondary" : "ghost"}
              onClick={() => setView("kanban")}
              size="sm"
              className="flex items-center"
            >
              <LayoutGrid className="w-4 h-4 mr-2" /> Kanban
            </Button>
            <Button
              variant={view === "lista" ? "secondary" : "ghost"}
              onClick={() => setView("lista")}
              size="sm"
              className="flex items-center"
            >
              <List className="w-4 h-4 mr-2" /> Lista
            </Button>
          </div>

          <div className="flex gap-2 items-center bg-card p-1 border rounded-lg">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}
            >
              Anterior
            </Button>
            <span className="text-sm font-bold px-2 capitalize">
              {format(currentDate, 'MMMM yyyy')}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}
            >
              Próximo
            </Button>
          </div>
        </div>

        {/* Content View */}
        {view === "kanban" ? (
          <RdoKanbanBoard
            rdoList={rdoList || []}
            obraId={selectedObraId}
            isLoading={isLoadingRdoList}
          />
        ) : isMobile ? (
          <RdoMobileList
            rdoList={rdoList || []}
            obraId={selectedObraId}
            isLoading={isLoadingRdoList}
          />
        ) : (
          <RdoKanbanBoard
            rdoList={rdoList || []}
            obraId={selectedObraId}
            isLoading={isLoadingRdoList}
          />
        )}
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Gestão de RDO</h1>
            <p className="text-muted-foreground">Relatórios Diários e Acompanhamento Visual.</p>
          </div>
          <div className="flex flex-wrap gap-3 items-center">
            <ObraSelector
              selectedObraId={selectedObraId}
              onSelectObra={setSelectedObraId}
            />
            {selectedObraId && (
              <RdoDialog
                obraId={selectedObraId}
                date={new Date()}
                trigger={
                  <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg font-semibold">
                    <Plus className="w-5 h-5 mr-2" /> Novo RDO (Hoje)
                  </Button>
                }
              />
            )}
          </div>
        </div>

        {renderContent()}
      </div>

      {/* Floating Action Button for Mobile */}
      {isMobile && selectedObraId && (
        <div className="fixed bottom-6 right-6 z-10">
          <RdoDialog
            obraId={selectedObraId}
            date={new Date()}
            trigger={
              <Button size="lg" className="rounded-full shadow-lg w-14 h-14">
                <Plus className="w-6 h-6" />
              </Button>
            }
          />
        </div>
      )}
    </DashboardLayout>
  );
};

export default GestaoRdo;