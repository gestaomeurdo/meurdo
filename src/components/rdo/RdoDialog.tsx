import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileText, Loader2, Construction, Zap } from "lucide-react";
import RdoForm from "./RdoForm";
import { useState, useEffect, useMemo } from "react";
import { useRdoByDate, fetchPreviousRdo } from "@/hooks/use-rdo";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { useObras } from "@/hooks/use-obras";
import ObraSelector from "../financeiro/ObraSelector";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { useRdoLimits } from "@/hooks/use-rdo-limits";
import UpgradeModal from "../subscription/UpgradeModal";

interface RdoDialogProps {
  obraId: string;
  date: Date;
  trigger?: React.ReactNode;
}

const RdoDialog = ({ obraId: initialObraId, date, trigger }: RdoDialogProps) => {
  const [open, setOpen] = useState(false);
  const [selectedObraId, setSelectedObraId] = useState<string | undefined>(initialObraId);
  const dateString = format(date, 'yyyy-MM-dd');
  const { data: obras, isLoading: isLoadingObras } = useObras();
  const { canCreateRdo, isPro, isLoading: isLoadingLimits } = useRdoLimits();
  const [showUpgrade, setShowUpgrade] = useState(false);

  const needsObraSelection = useMemo(() => {
    return !obras || obras.length === 0 || initialObraId === '00000000-0000-0000-0000-000000000000';
  }, [obras, initialObraId]);

  useEffect(() => {
    if (open && needsObraSelection && obras && obras.length > 0) {
      setSelectedObraId(obras[0].id);
    } else if (open && !needsObraSelection) {
      setSelectedObraId(initialObraId);
    }
  }, [open, obras, needsObraSelection, initialObraId]);

  const validObraId = selectedObraId && selectedObraId !== '00000000-0000-0000-0000-000000000000' ? selectedObraId : undefined;

  const { data: rdoData, isLoading: isLoadingRdo, refetch } = useRdoByDate(validObraId || '', dateString);
  const isEditing = !!rdoData;

  const { data: previousRdoData, isLoading: isLoadingPreviousRdo } = useQuery({
    queryKey: ['previousRdo', validObraId, dateString],
    queryFn: () => fetchPreviousRdo(validObraId!, date),
    enabled: open && !isEditing && !!validObraId,
  });

  const handleSuccess = () => {
    refetch();
    setOpen(false);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen && !isEditing && !canCreateRdo && !isPro) {
      setShowUpgrade(true);
      return;
    }
    setOpen(newOpen);
  };

  const isLoading = isLoadingRdo || (!isEditing && isLoadingPreviousRdo) || isLoadingObras || isLoadingLimits;

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          {trigger || (
            <Button variant="outline" size="sm">
              <FileText className="w-4 h-4 mr-2" />
              {isEditing ? "Ver RDO" : "Criar RDO"}
            </Button>
          )}
        </DialogTrigger>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black uppercase tracking-tight">
              {isEditing ? `Diário de ${format(date, 'dd/MM/yyyy')}` : `Novo RDO para ${format(date, 'dd/MM/yyyy')}`}
            </DialogTitle>
            <DialogDescription>
              {isEditing ? "Registro técnico oficial de campo." : "Registre as atividades e equipe do dia de hoje."}
            </DialogDescription>
          </DialogHeader>
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : obras && obras.length === 0 ? (
            <Card className="border-dashed py-12 text-center rounded-2xl">
              <CardContent>
                <Construction className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">Você precisa cadastrar uma obra primeiro.</p>
                <Button asChild className="mt-4 rounded-xl"><Link to="/obras">Ir para Obras</Link></Button>
              </CardContent>
            </Card>
          ) : !validObraId ? (
            <div className="space-y-4">
              <p className="text-sm font-bold text-muted-foreground uppercase">Selecione a obra de destino:</p>
              <ObraSelector selectedObraId={selectedObraId} onSelectObra={setSelectedObraId} />
              <Button 
                className="w-full rounded-xl h-12 font-bold"
                onClick={() => setSelectedObraId(selectedObraId)} 
                disabled={!selectedObraId || selectedObraId === '00000000-0000-0000-0000-000000000000'}
              >
                Prosseguir para o Formulário
              </Button>
            </div>
          ) : (
            <RdoForm 
              obraId={validObraId} 
              initialData={rdoData || undefined} 
              onSuccess={handleSuccess} 
              previousRdoData={previousRdoData} 
            />
          )}
        </DialogContent>
      </Dialog>

      <UpgradeModal 
        open={showUpgrade} 
        onOpenChange={setShowUpgrade} 
        title="Limite de Diários Atingido"
        description="No plano gratuito você pode registrar até 2 RDOs. Desbloqueie o PRO para histórico ilimitado."
      />
    </>
  );
};

export default RdoDialog;