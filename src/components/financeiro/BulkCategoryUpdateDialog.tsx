import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Tag, CheckCircle } from "lucide-react";
import { useState } from "react";
import { useBulkUpdateCategory } from "@/hooks/use-financial-entries";
import { useExpenseCategories, ExpenseCategory } from "@/hooks/use-expense-categories";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { showError, showSuccess } from "@/utils/toast";

interface BulkCategoryUpdateDialogProps {
  selectedEntryIds: string[];
  obraId: string;
  onSuccess: () => void;
}

const BulkCategoryUpdateDialog = ({ selectedEntryIds, obraId, onSuccess }: BulkCategoryUpdateDialogProps) => {
  const [open, setOpen] = useState(false);
  const [newCategoryId, setNewCategoryId] = useState<string | undefined>(undefined);
  const { data: categories, isLoading: isLoadingCategories } = useExpenseCategories();
  const bulkUpdateMutation = useBulkUpdateCategory();

  const handleUpdate = async () => {
    if (!newCategoryId) {
      showError("Selecione uma nova categoria.");
      return;
    }

    try {
      await bulkUpdateMutation.mutateAsync({
        ids: selectedEntryIds,
        categoria_id: newCategoryId,
      });
      showSuccess(`${selectedEntryIds.length} lançamentos atualizados com sucesso!`);
      onSuccess();
      setOpen(false);
    } catch (error) {
      showError(`Erro ao atualizar em massa: ${error instanceof Error ? error.message : "Erro desconhecido"}`);
    }
  };

  const isLoading = bulkUpdateMutation.isPending || isLoadingCategories;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="secondary" 
          size="sm" 
          disabled={selectedEntryIds.length === 0}
          className="flex items-center"
        >
          <Tag className="w-4 h-4 mr-2" />
          Mudar Categoria ({selectedEntryIds.length})
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>Atualização de Categoria em Massa</DialogTitle>
          <DialogDescription>
            Você está prestes a alterar a categoria de **{selectedEntryIds.length}** lançamentos.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <label className="block text-sm font-medium">Nova Categoria</label>
          <Select onValueChange={setNewCategoryId} disabled={isLoading}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione a nova categoria" />
            </SelectTrigger>
            <SelectContent>
              {categories?.map((category: ExpenseCategory) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={() => setOpen(false)} disabled={isLoading}>Cancelar</Button>
          <Button onClick={handleUpdate} disabled={isLoading || !newCategoryId}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
            Confirmar Atualização
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BulkCategoryUpdateDialog;