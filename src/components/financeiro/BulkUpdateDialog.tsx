import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, CalendarIcon, DollarSign, CheckCircle, Edit } from "lucide-react";
import { useState } from "react";
import { useBulkUpdateFinancialEntries, PaymentMethod } from "@/hooks/use-financial-entries";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { showError, showSuccess } from "@/utils/toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface BulkUpdateDialogProps {
  selectedEntryIds: string[];
  onSuccess: () => void;
}

const paymentMethods: PaymentMethod[] = ['Pix', 'Dinheiro', 'Cartão', 'Boleto', 'Transferência'];

const BulkUpdateDialog = ({ selectedEntryIds, onSuccess }: BulkUpdateDialogProps) => {
  const [open, setOpen] = useState(false);
  const [newDate, setNewDate] = useState<Date | undefined>(undefined);
  const [newPaymentMethod, setNewPaymentMethod] = useState<PaymentMethod | undefined>(undefined);
  const bulkUpdateMutation = useBulkUpdateFinancialEntries();

  const handleUpdate = async () => {
    if (!newDate && !newPaymentMethod) {
      showError("Selecione pelo menos uma data ou forma de pagamento para atualizar.");
      return;
    }

    const payload: { ids: string[], data_gasto?: string, forma_pagamento?: PaymentMethod } = {
        ids: selectedEntryIds,
    };

    if (newDate) {
        payload.data_gasto = format(newDate, 'yyyy-MM-dd');
    }
    if (newPaymentMethod) {
        payload.forma_pagamento = newPaymentMethod;
    }

    try {
      await bulkUpdateMutation.mutateAsync(payload);
      showSuccess(`${selectedEntryIds.length} lançamentos atualizados com sucesso!`);
      onSuccess();
      setOpen(false);
      setNewDate(undefined);
      setNewPaymentMethod(undefined);
    } catch (error) {
      showError(`Erro ao atualizar em massa: ${error instanceof Error ? error.message : "Erro desconhecido"}`);
    }
  };

  const isLoading = bulkUpdateMutation.isPending;
  const isUpdateDisabled = isLoading || (!newDate && !newPaymentMethod);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="secondary" 
          size="sm" 
          disabled={selectedEntryIds.length === 0}
          className="flex items-center"
        >
          <Edit className="w-4 h-4 mr-2" />
          Editar em Massa ({selectedEntryIds.length})
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>Atualização de Lançamentos em Massa</DialogTitle>
          <DialogDescription>
            Você está prestes a alterar a data e/ou forma de pagamento de **{selectedEntryIds.length}** lançamentos.
            Deixe o campo em branco se não quiser alterá-lo.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* New Date Field */}
          <div className="space-y-2">
            <label className="block text-sm font-medium">Nova Data do Gasto (Opcional)</label>
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        variant={"outline"}
                        className={cn(
                            "w-full pl-3 text-left font-normal",
                            !newDate && "text-muted-foreground"
                        )}
                        disabled={isLoading}
                    >
                        {newDate ? format(newDate, "dd/MM/yyyy") : <span>Não alterar data</span>}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                        mode="single"
                        selected={newDate}
                        onSelect={setNewDate}
                        initialFocus
                    />
                </PopoverContent>
            </Popover>
          </div>

          {/* New Payment Method Field */}
          <div className="space-y-2">
            <label className="block text-sm font-medium">Nova Forma de Pagamento (Opcional)</label>
            <Select onValueChange={(val) => setNewPaymentMethod(val as PaymentMethod)} disabled={isLoading}>
              <SelectTrigger>
                <SelectValue placeholder="Não alterar forma de pagamento" />
              </SelectTrigger>
              <SelectContent>
                {paymentMethods.map((method) => (
                  <SelectItem key={method} value={method}>
                    {method}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={() => setOpen(false)} disabled={isLoading}>Cancelar</Button>
          <Button onClick={handleUpdate} disabled={isUpdateDisabled}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
            Confirmar Edição
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BulkUpdateDialog;