import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import AtividadeForm from "./AtividadeForm";
import { Atividade } from "@/hooks/use-atividades";
import { useState } from "react";

interface AtividadeDialogProps {
  obraId: string;
  initialData?: Atividade;
  trigger?: React.ReactNode;
}

const AtividadeDialog = ({ obraId, initialData, trigger }: AtividadeDialogProps) => {
  const [open, setOpen] = useState(false);
  const isEditing = !!initialData;

  const handleSuccess = () => {
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Nova Atividade
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Atividade" : "Registrar Nova Atividade"}</DialogTitle>
          <DialogDescription>
            {isEditing 
              ? "Atualize os detalhes do registro de atividade." 
              : "Descreva o que foi realizado na obra nesta data, incluindo custos de deslocamento."}
          </DialogDescription>
        </DialogHeader>
        <AtividadeForm obraId={obraId} initialData={initialData} onSuccess={handleSuccess} />
      </DialogContent>
    </Dialog>
  );
};

export default AtividadeDialog;