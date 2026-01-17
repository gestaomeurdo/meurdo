import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import ReceiptForm from "./ReceiptForm";
import { useState } from "react";

interface MaterialReceiptDialogProps {
  obraId: string;
  trigger?: React.ReactNode;
}

const MaterialReceiptDialog = ({ obraId, trigger }: MaterialReceiptDialogProps) => {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="bg-[#066abc] hover:bg-[#066abc]/90 rounded-xl shadow-lg">
            <Plus className="w-4 h-4 mr-2" />
            Receber Material
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black uppercase tracking-tight">Novo Recebimento</DialogTitle>
          <DialogDescription>Registre a chegada de materiais no canteiro de obras.</DialogDescription>
        </DialogHeader>
        <ReceiptForm obraId={obraId} onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
};

export default MaterialReceiptDialog;