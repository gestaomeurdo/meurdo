import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileText, Loader2 } from "lucide-react";
import RdoForm from "./RdoForm";
import { useState } from "react";
import { useRdoByDate } from "@/hooks/use-rdo";
import { format } from "date-fns";

interface RdoDialogProps {
  obraId: string;
  date: Date;
  trigger?: React.ReactNode;
}

const RdoDialog = ({ obraId, date, trigger }: RdoDialogProps) => {
  const [open, setOpen] = useState(false);
  const dateString = format(date, 'yyyy-MM-dd');
  
  const { data: rdoData, isLoading, refetch } = useRdoByDate(obraId, dateString);
  const isEditing = !!rdoData;

  const handleSuccess = () => {
    refetch(); // Refresh data after save
    setOpen(false);
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen) {
        refetch(); // Ensure we fetch the latest data when opening
    }
  };

  const title = isEditing ? `Editar RDO de ${format(date, 'dd/MM/yyyy')}` : `Criar RDO para ${format(date, 'dd/MM/yyyy')}`;
  const description = isEditing ? "Atualize o Relatório Diário de Obra." : "Preencha o Relatório Diário de Obra para esta data.";

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
        
        {isLoading ? (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2">Carregando RDO...</span>
            </div>
        ) : (
            <RdoForm 
                obraId={obraId} 
                initialData={rdoData || undefined} 
                onSuccess={handleSuccess} 
            />
        )}
      </DialogContent>
    </Dialog>
  );
};

export default RdoDialog;