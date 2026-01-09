import DashboardLayout from "@/components/layout/DashboardLayout";
import { useObras } from "@/hooks/use-obras";
import { useState, useEffect, useMemo } from "react";
import { Loader2, FileText, Plus, LayoutGrid, List, AlertTriangle, Calendar as CalendarIcon, Trash2 } from "lucide-react";
import ObraSelector from "@/components/financeiro/ObraSelector";
import { Button } from "@/components/ui/button";
import { DateRange } from "react-day-picker";
import { format, parseISO, isSameMonth } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { useRdoList, useDeleteAllRdo } from "@/hooks/use-rdo";
import RdoDashboard from "@/components/rdo/RdoDashboard";
import RdoKanbanBoard from "@/components/rdo/RdoKanbanBoard";
import RdoMobileList from "@/components/rdo/RdoMobileList";
import RdoListTable from "@/components/rdo/RdoListTable";
import RdoCalendar from "@/components/rdo/RdoCalendar";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useIsMobile } from "@/hooks/use-mobile";
import RdoDialog from "@/components/rdo/RdoDialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { showSuccess, showError } from "@/utils/toast";

const GestaoRdo = () => {
  const { data: obras, isLoading: isLoadingObras, error: obrasError } = useObras();
  const [selectedObraId, setSelectedObraId] = useState<string | undefined>(undefined);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'kanban' | 'lista' | 'calendario'>('calendario');
  const isMobile = useIsMobile();
  const deleteAllMutation = useDeleteAllRdo();

  useEffect(() => {
    if (obras && obras.length > 0 && !selectedObraId) {
      setSelectedObraId(obras[0].id);
    }
  }, [obras, selectedObraId]);

  const selectedObra = obras?.find(o => o.id === selectedObraId);
  const { data: rdoList, isLoading: isLoadingRdoList, error: rdoError } = useRdoList(selectedObraId || '');

  const handleClearAll = async () => {
    if (!selectedObraId) return;
    try {
      await deleteAllMutation.mutateAsync(selectedObraId);
      showSuccess("Todos os RDOs desta obra foram removidos.");
    } catch (err) {
      showError("Erro ao limpar RDOs.");
    }
  };

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
    
    const commonProps = {
        rdoList: rdoList || [],
        obraId: selectedObraId,
        isLoading: isLoadingRdoList,
    };

    let contentView;
    
    if (view === "calendario") {
        contentView = (
            <RdoCalendar
                obraId={selectedObraId}
                rdoList={rdoList || []}
                currentDate={currentDate}
            />
        );
    } else if (view === "kanban") {
        contentView = (
            <RdoKanbanBoard
                {...commonProps}
            />
        );
    } else { // view === "lista"
        contentView = isMobile ? (
            <RdoMobileList
                {...commonProps}
            />
        ) : (
            <RdoListTable
                {...commonProps}
            />
        );
    }

    return (
      <div className="space-y-6">
        <RdoDashboard
          rdoList={rdoList || []}
          currentDate={currentDate}
          isLoading={isLoadingRdoList}
        />

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="bg-card border rounded-xl p-1 inline-flex w-full sm:w-auto">
            <Button
              variant={view === "calendario" ? "secondary" : "ghost"}
              onClick={() => setView("calendario")}
              size="sm"
              className="flex-1 sm:flex-none flex items-center"
            >
              <CalendarIcon className="w-4 h-4 mr-2" /> Calendário
            </Button>
            <Button
              variant={view === "kanban" ? "secondary" : "ghost"}
              onClick={() => setView("kanban")}
              size="sm"
              className="flex-1 sm:flex-none flex items-center"
            >
              <LayoutGrid className="w-4 h-4 mr-2" /> Kanban
            </Button>
            <Button
              variant={view === "lista" ? "secondary" : "ghost"}
              onClick={() => setView("lista")}
              size="sm"
              className="flex-1 sm:flex-none flex items-center"
            >
              <List className="w-4 h-4 mr-2" /> Lista
            </Button>
          </div>

          <div className="flex gap-2 items-center bg-card p-1 border rounded-lg w-full sm:w-auto justify-between">
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

        {rdoList && rdoList.length > 0 && (
          <div className="flex justify-end">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10">
                  <Trash2 className="w-4 h-4 mr-2" /> Limpar Todos RDOs
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Apagar todos os RDOs?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta ação removerá definitivamente todos os Relatórios Diários de Obra desta construção. Não poderá ser desfeito.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleClearAll} className="bg-destructive hover:bg-destructive/90">
                    Sim, Apagar Tudo
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}

        {contentView}
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