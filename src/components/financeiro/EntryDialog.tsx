import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import EntryForm from "./EntryForm";
import { FinancialEntry } from "@/hooks/use-financial-entries";
import { useState } from "react";

interface EntryDialogProps {
  obraId: string;
  initialData?: FinancialEntry;
  trigger?: React.ReactNode;
}

const EntryDialog = ({ obraId, initialData, trigger }: EntryDialogProps) => {
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
            Novo Lançamento
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Lançamento" : "Novo Lançamento Financeiro"}</DialogTitle>
          <DialogDescription>
            {isEditing 
              ? "Modifique os detalhes deste lançamento financeiro." 
              : "Registre uma nova despesa ou pagamento associado a esta obra."}
          </DialogDescription>
        </DialogHeader>
        <EntryForm obraId={obraId} initialData={initialData} onSuccess={handleSuccess} />
      </DialogContent>
    </Dialog>
  );
};

export default EntryDialog;