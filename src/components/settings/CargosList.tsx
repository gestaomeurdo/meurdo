import { useCargos, useDeleteCargo, useDeleteAllCargos, Cargo, useBulkCreateCargos } from "@/hooks/use-cargos";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Loader2, Users, FileUp, AlertTriangle, Plus, Library, Zap } from "lucide-react";
import { formatCurrency } from "@/utils/formatters";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import CargoForm from "./CargoForm";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import CargoImportDialog from "./CargoImportDialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { showSuccess, showError } from "@/utils/toast";
import { DEFAULT_CARGOS } from "@/utils/default-cargos";
import { useCargoLimits } from "@/hooks/use-cargo-limits";
import UpgradeButton from "../subscription/UpgradeButton";

const CargosList = () => {
  const { data: cargos, isLoading, error } = useCargos();
  const { canCreateCargo, isPro, cargoCount, limit, isLoading: isLoadingLimits } = useCargoLimits();
  const deleteMutation = useDeleteCargo();
  const deleteAllMutation = useDeleteAllCargos();
  const bulkCreateMutation = useBulkCreateCargos();
  const [editingCargo, setEditingCargo] = useState<Cargo | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleClearAll = async () => {
    try {
      await deleteAllMutation.mutateAsync();
      showSuccess("Banco de cargos limpo com sucesso.");
    } catch (err) {
      showError("Erro ao limpar cargos.");
    }
  };

  const handleLoadSuggested = async () => {
    try {
      // Filter out cargos that would exceed the limit if not PRO
      const cargosToInsert = isPro ? DEFAULT_CARGOS : DEFAULT_CARGOS.slice(0, limit - cargoCount);
      
      if (cargosToInsert.length === 0) {
        showError("Limite de cargos atingido. Faça upgrade para adicionar mais.");
        return;
      }
      
      await bulkCreateMutation.mutateAsync(cargosToInsert);
      showSuccess(`${cargosToInsert.length} cargos sugeridos adicionados.`);
    } catch (err) {
      showError("Erro ao carregar cargos sugeridos.");
    }
  };

  if (isLoading || isLoadingLimits) {
    return (
      <div className="flex flex-col items-center justify-center p-12 gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Buscando cargos...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="my-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Erro ao carregar cargos</AlertTitle>
        <AlertDescription>
          {error.message || "Não foi possível carregar a lista. Verifique sua conexão ou permissões."}
        </AlertDescription>
      </Alert>
    );
  }

  const canLoadSuggested = !isPro && cargoCount >= limit;
  const suggestedCount = DEFAULT_CARGOS.length;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <h3 className="text-lg font-semibold flex items-center">
          <Users className="w-5 h-5 mr-2" />
          Cargos Cadastrados ({cargoCount})
        </h3>
        <div className="flex flex-wrap gap-2">
          {/* Load Suggested Button */}
          <Button 
            variant="default" 
            size="sm" 
            className="bg-[#066abc] hover:bg-[#066abc]/90 flex items-center"
            onClick={handleLoadSuggested}
            disabled={bulkCreateMutation.isPending || (!isPro && cargoCount >= limit)}
          >
            {bulkCreateMutation.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Library className="w-4 h-4 mr-2" />
            )}
            Carregar Sugestões
          </Button>
          <CargoImportDialog 
            trigger={
              <Button variant="outline" size="sm" className="flex items-center">
                <FileUp className="w-4 h-4 mr-2" />
                Importar CSV
              </Button>
            } 
          />
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) setEditingCargo(null);
          }}>
            <DialogTrigger asChild>
              <Button size="sm" disabled={!canCreateCargo}>
                <Plus className="w-4 h-4 mr-2" />
                Novo Cargo
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingCargo ? "Editar Cargo" : "Cadastrar Novo Cargo"}</DialogTitle>
              </DialogHeader>
              <CargoForm 
                initialData={editingCargo || undefined} 
                onSuccess={() => setIsDialogOpen(false)} 
              />
            </DialogContent>
          </Dialog>
          {cargos && cargos.length > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Limpar Banco
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Apagar todos os cargos?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Isso removerá definitivamente todos os cargos cadastrados no seu banco de referência.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleClearAll} 
                    className="bg-destructive hover:bg-destructive/90"
                  >
                    Sim, Apagar Tudo
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      {/* Limit Warning */}
      {!isPro && (
        <Alert 
          variant={cargoCount >= limit ? "destructive" : "default"} 
          className={cargoCount >= limit ? "bg-destructive/5 border-destructive/30" : "bg-orange-500/5 border-orange-500/30"}
        >
          <Zap className="h-4 w-4" />
          <AlertTitle>{cargoCount >= limit ? "Limite Atingido" : "Plano Gratuito"}</AlertTitle>
          <AlertDescription className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <span>
              Você está usando {cargoCount} de {limit} cargos disponíveis. Assine o PRO para cadastro ilimitado.
            </span>
            {!isPro && cargoCount >= limit && <UpgradeButton />}
          </AlertDescription>
        </Alert>
      )}

      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Unidade</TableHead>
              <TableHead className="text-right">Custo</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cargos && cargos.length > 0 ? (
              cargos.map((cargo) => (
                <TableRow key={cargo.id}>
                  <TableCell className="font-medium">{cargo.nome}</TableCell>
                  <TableCell>
                    <Badge variant={cargo.tipo === 'Próprio' ? "default" : "secondary"}>
                      {cargo.tipo}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{cargo.unidade}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {formatCurrency(cargo.custo_diario)}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => {
                        setEditingCargo(cargo);
                        setIsDialogOpen(true);
                      }}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => deleteMutation.mutate(cargo.id)} 
                      className="text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  Nenhum cargo cadastrado. Use o botão acima para adicionar.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default CargosList;