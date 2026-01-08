import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2, Loader2, AlertTriangle, ArrowLeft } from "lucide-react";
import { useExpenseCategories, useDeleteExpenseCategory, ExpenseCategory } from "@/hooks/use-expense-categories";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useState } from "react";
import CategoryForm from "./CategoryForm";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { showSuccess, showError } from "@/utils/toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { countEntriesInCategory } from "@/utils/category-migration";
import { useQuery } from "@tanstack/react-query";

interface CategoryManagementDialogProps {
  trigger: React.ReactNode;
}

const DeleteCategoryButton = ({ category, deleteMutation }: { category: ExpenseCategory, deleteMutation: ReturnType<typeof useDeleteExpenseCategory> }) => {
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  
  // Mantemos a contagem apenas para informar o usuário visualmente
  const { data: entriesCount, isLoading: isLoadingCount } = useQuery({
    queryKey: ['categoryEntryCount', category.id],
    queryFn: () => countEntriesInCategory(category.id),
    enabled: isAlertOpen,
  });

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(category.id);
      showSuccess(`Categoria "${category.nome}" excluída.`);
      setIsAlertOpen(false);
    } catch (err) {
      showError(`Erro ao excluir: ${err instanceof Error ? err.message : "Erro desconhecido"}`);
    }
  };

  const isDeleting = deleteMutation.isPending;

  return (
    <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
      <AlertDialogTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          title="Excluir" 
          className="text-destructive hover:bg-destructive/10"
          disabled={isDeleting || category.nome === 'Sem Categoria'}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja excluir a categoria <span className="font-bold">"{category.nome}"</span>?
            
            <div className="mt-4">
              {isLoadingCount ? (
                <div className="flex items-center text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Verificando lançamentos...
                </div>
              ) : entriesCount && entriesCount > 0 ? (
                <Alert variant="default" className="bg-primary/10 border-primary/20">
                  <AlertTriangle className="h-4 w-4 text-primary" />
                  <AlertTitle className="text-primary">Ação Automática</AlertTitle>
                  <AlertDescription>
                    Existem **{entriesCount}** lançamentos associados. Eles serão movidos automaticamente para **"Sem Categoria"** pelo banco de dados.
                  </AlertDescription>
                </Alert>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Não há lançamentos associados. A exclusão será imediata.
                </p>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-destructive hover:bg-destructive/90"
          >
            {isDeleting ? "Excluindo..." : "Excluir"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

const CategoryManagementDialog = ({ trigger }: CategoryManagementDialogProps) => {
  const { data: categories, isLoading, error } = useExpenseCategories();
  const deleteMutation = useDeleteExpenseCategory();
  const [open, setOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ExpenseCategory | null>(null);

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setEditingCategory(null);
  };
  
  const handleFormCancel = () => {
    setIsFormOpen(false);
    setEditingCategory(null);
  };

  const handleEdit = (category: ExpenseCategory) => {
    setEditingCategory(category);
    setIsFormOpen(true);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Gerenciar Categorias de Despesa</DialogTitle>
          <DialogDescription>
            {isFormOpen ? "Preencha os dados da categoria." : "Edite ou exclua categorias. O banco de dados moverá lançamentos órfãos automaticamente."}
          </DialogDescription>
        </DialogHeader>

        {isFormOpen ? (
          <>
            <Button variant="ghost" onClick={handleFormCancel} className="w-fit text-sm mb-2">
              <ArrowLeft className="w-4 h-4 mr-2" /> Voltar para a Lista
            </Button>
            <CategoryForm initialData={editingCategory || undefined} onSuccess={handleFormSuccess} />
          </>
        ) : (
          <div className="space-y-4 flex flex-col flex-grow">
            <div className="flex justify-end">
              <Button onClick={() => setIsFormOpen(true)} size="sm">
                <Plus className="w-4 h-4 mr-2" /> Nova Categoria
              </Button>
            </div>

            {isLoading ? (
              <div className="flex justify-center items-center h-32"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
            ) : error ? (
              <Alert variant="destructive"><AlertTriangle className="h-4 w-4" /><AlertTitle>Erro</AlertTitle><AlertDescription>{error.message}</AlertDescription></Alert>
            ) : (
              <div className="rounded-md border overflow-hidden flex-grow">
                <ScrollArea className="h-[400px]">
                  <Table>
                    <TableHeader className="bg-muted/50 sticky top-0 z-10">
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead className="text-right w-[100px]">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {categories?.map((category) => (
                        <TableRow key={category.id}>
                          <TableCell className="font-medium">{category.nome}</TableCell>
                          <TableCell className="text-sm text-muted-foreground max-w-xs truncate">{category.descricao || 'N/A'}</TableCell>
                          <TableCell className="text-right space-x-2">
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(category)} title="Editar"><Edit className="w-4 h-4" /></Button>
                            <DeleteCategoryButton category={category} deleteMutation={deleteMutation} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CategoryManagementDialog;