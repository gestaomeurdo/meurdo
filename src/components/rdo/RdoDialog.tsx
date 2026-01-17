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
import UpgradeButton from "../subscription/UpgradeButton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

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
  const { canCreateRdo, rdoCount, limit, isPro, isLoading: isLoadingLimits } = useRdoLimits();
  
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

  const { data: previousRdoData, isLoading: isLoadingPreviousRdo, refetch: refetchPrevious } = useQuery({
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
        setOpen(true); // Open the limit warning dialog
        return;
    }
    setOpen(newOpen);
  };

  const isLoading = isLoadingRdo || (!isEditing && isLoadingPreviousRdo) || isLoadingObras || isLoadingLimits;

  if (!isEditing && !canCreateRdo && !isPro && open) {
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="sm:max-w-[450px]">
                <DialogHeader>
                    <div className="mx-auto w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-4">
                        <Zap className="h-6 w-6 text-orange-600" />
                    </div>
                    <DialogTitle className="text-center text-xl">Limite de RDOs Atingido</DialogTitle>
                    <DialogDescription className="text-center pt-2">
                        Você atingiu o limite de **{limit} RDOs** no plano gratuito.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <Alert variant="default" className="bg-primary/10 border-primary/20">
                        <Zap className="h-4 w-4 text-primary" />
                        <AlertTitle className="text-primary font-bold">Plano PRO</AlertTitle>
                        <AlertDescription>
                            Desbloqueie registros ilimitados no plano PRO e tenha todos os recursos premium.
                        </AlertDescription>
                    </Alert>
                    <UpgradeButton />
                </div>
            </DialogContent>
        </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <FileText className="w-4 h-4 mr-2" />
            {isEditing ? "Ver RDO" : "Criar RDO"}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? `Editar RDO de ${format(date, 'dd/MM/yyyy')}` : `Criar RDO para ${format(date, 'dd/MM/yyyy')}`}</DialogTitle>
          <DialogDescription>{isEditing ? "Atualize o Relatório Diário de Obra." : "Preencha o Relatório Diário de Obra para esta data."}</DialogDescription>
        </DialogHeader>
        
        {isLoading ? (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2">Carregando dados...</span>
            </div>
        ) : obras && obras.length === 0 ? (
            <Card className="border-dashed py-12 text-center">
                <CardContent>
                    <Construction className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                    <p className="text-muted-foreground">Você precisa cadastrar uma obra primeiro.</p>
                    <Button asChild className="mt-4"><Link to="/obras">Ir para Obras</Link></Button>
                </CardContent>
            </Card>
        ) : !validObraId ? (
            <div className="space-y-4">
                <p className="text-sm text-muted-foreground">Selecione a obra:</p>
                <ObraSelector selectedObraId={selectedObraId} onSelectObra={setSelectedObraId} />
                <Button onClick={() => setSelectedObraId(selectedObraId)} disabled={!selectedObraId || selectedObraId === '00000000-0000-0000-0000-000000000000'}>Continuar</Button>
            </div>
        ) : (
            <RdoForm obraId={validObraId} initialData={rdoData || undefined} onSuccess={handleSuccess} previousRdoData={previousRdoData} />
        )}
      </DialogContent>
    </Dialog>
  );
};

export default RdoDialog;