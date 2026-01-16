import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileText, Loader2, Construction } from "lucide-react";
import RdoForm from "./RdoForm";
import { useState, useEffect, useMemo } from "react";
import { useRdoByDate, fetchPreviousRdo } from "@/hooks/use-rdo";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { useObras } from "@/hooks/use-obras";
import ObraSelector from "../financeiro/ObraSelector";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";

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
  
  // Determine if we need to force selection
  const needsObraSelection = useMemo(() => {
    // If the initialObraId is a placeholder, or if no obra is selected
    return !obras || obras.length === 0 || initialObraId === '00000000-0000-0000-0000-000000000000';
  }, [obras, initialObraId]);

  // Set default selectedObraId if we have obras and no valid ID is set yet
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

  // Fetch previous RDO data only if we are creating a new one and the dialog is open
  const { data: previousRdoData, isLoading: isLoadingPreviousRdo, refetch: refetchPrevious } = useQuery({
    queryKey: ['previousRdo', validObraId, dateString],
    queryFn: () => fetchPreviousRdo(validObraId!, date),
    enabled: open && !isEditing && !!validObraId,
  });

  const handleSuccess = () => {
    refetch(); // Refresh data after save
    setOpen(false);
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen) {
        if (validObraId) {
            refetch(); // Ensure we fetch the latest data when opening
            if (!isEditing) {
                refetchPrevious();
            }
        }
    } else {
        // Reset selectedObraId if it was a placeholder initially
        if (initialObraId === '00000000-0000-0000-0000-000000000000') {
            setSelectedObraId(undefined);
        }
    }
  };

  const title = isEditing ? `Editar RDO de ${format(date, 'dd/MM/yyyy')}` : `Criar RDO para ${format(date, 'dd/MM/yyyy')}`;
  const description = isEditing ? "Atualize o Relatório Diário de Obra." : "Preencha o Relatório Diário de Obra para esta data.";

  const isLoading = isLoadingRdo || (!isEditing && isLoadingPreviousRdo) || isLoadingObras;

  const renderContent = () => {
    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2">Carregando dados...</span>
            </div>
        );
    }

    if (obras && obras.length === 0) {
        return (
            <Card className="border-dashed py-12 text-center">
                <CardContent>
                    <Construction className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                    <p className="text-muted-foreground">Você precisa cadastrar uma obra primeiro.</p>
                    <Button asChild className="mt-4">
                        <Link to="/obras">Ir para Obras</Link>
                    </Button>
                </CardContent>
            </Card>
        );
    }

    if (!validObraId) {
        return (
            <div className="space-y-4">
                <p className="text-sm text-muted-foreground">Selecione a obra para a qual deseja criar o RDO:</p>
                <ObraSelector 
                    selectedObraId={selectedObraId} 
                    onSelectObra={setSelectedObraId} 
                />
                <Button 
                    onClick={() => {
                        if (selectedObraId) {
                            // If an obra is selected, force re-render to show the form
                            setSelectedObraId(selectedObraId);
                        }
                    }}
                    disabled={!selectedObraId || selectedObraId === '00000000-0000-0000-0000-000000000000'}
                >
                    Continuar
                </Button>
            </div>
        );
    }

    return (
        <RdoForm
            obraId={validObraId}
            initialData={rdoData || undefined}
            onSuccess={handleSuccess}
            previousRdoData={previousRdoData}
        />
    );
  };

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
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {renderContent()}
      </DialogContent>
    </Dialog>
  );
};

export default RdoDialog;