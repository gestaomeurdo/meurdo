import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import ObraForm from "./ObraForm";
import { Obra } from "@/hooks/use-obras";
import { useState } from "react";

interface ObraDialogProps {
  initialData?: Obra;
  trigger?: React.ReactNode;
}

const ObraDialog = ({ initialData, trigger }: ObraDialogProps) => {
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
            Nova Obra
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Obra" : "Criar Nova Obra"}</DialogTitle>
          <DialogDescription>
            {isEditing 
              ? "Atualize as informações da obra selecionada." 
              : "Preencha os campos abaixo para cadastrar uma nova obra no sistema."}
          </DialogDescription>
        </DialogHeader>
        <ObraForm initialData={initialData} onSuccess={handleSuccess} />
      </DialogContent>
    </Dialog>
  );
};

export default ObraDialog;