import { useCargos, useDeleteCargo, useDeleteAllCargos, Cargo, useBulkCreateCargos } from "@/hooks/use-cargos";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Users, FileUp, AlertTriangle, Plus, Library, Zap } from "lucide-react";
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
import { Skeleton } from "@/components/ui/skeleton";

const CargoTableSkeleton = () => (
  <div className="space-y-3">
    {[1, 2, 3, 4].map(i => (
      <div key={i} className="flex gap-4 p-4 border-b">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-4 w-1/6" />
        <Skeleton className="h-4 w-1/6" />
        <Skeleton className="h-4 w-1/6 ml-auto" />
      </div>
    ))}
  </div>
);

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
      showSuccess("Banco de cargos limpo.");
    } catch (err) {
      showError("Erro ao limpar.");
    }
  };

  const handleLoadSuggested = async () => {
    try {
      const cargosToInsert = isPro ? DEFAULT_CARGOS : DEFAULT_CARGOS.slice(0, limit - cargoCount);
      if (cargosToInsert.length === 0) {
        showError("Limite atingido.");
        return;
      }
      await bulkCreateMutation.mutateAsync(cargosToInsert);
      showSuccess(`Sugeridos adicionados.`);
    } catch (err) {
      showError("Erro ao carregar.");
    }
  };

  if (error) {
    return (
      <Alert variant="destructive" className="my-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Erro ao carregar cargos</AlertTitle>
        <AlertDescription>{error.message}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h3 className="text-lg font-bold uppercase tracking-tight flex items-center">
          <Users className="w-5 h-5 mr-2 text-primary" />
          Banco de Funções ({cargoCount})
        </h3>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={handleLoadSuggested} disabled={bulkCreateMutation.isPending || (!isPro && cargoCount >= limit)}>
            {bulkCreateMutation.isPending ? <Zap className="w-4 h-4 mr-2 animate-pulse" /> : <Library className="w-4 h-4 mr-2" />}
            Carregar Sugestões
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild><Button size="sm" disabled={!canCreateCargo}><Plus className="w-4 h-4 mr-2" /> Novo Cargo</Button></DialogTrigger>
            <DialogContent><DialogHeader><DialogTitle>{editingCargo ? "Editar Cargo" : "Novo Cargo"}</DialogTitle></DialogHeader>
              <CargoForm initialData={editingCargo || undefined} onSuccess={() => setIsDialogOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {!isPro && (
        <Alert className="bg-orange-500/5 border-orange-500/20">
          <Zap className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-xs font-bold uppercase flex justify-between items-center w-full">
            <span>{cargoCount} de {limit} cargos usados.</span>
            {cargoCount >= limit && <UpgradeButton />}
          </AlertDescription>
        </Alert>
      )}

      <div className="rounded-2xl border overflow-hidden bg-card">
        {isLoading || isLoadingLimits ? (
          <CargoTableSkeleton />
        ) : (
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Custo</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cargos?.map((cargo) => (
                <TableRow key={cargo.id}>
                  <TableCell className="font-bold uppercase text-xs">{cargo.nome}</TableCell>
                  <TableCell><Badge variant="outline" className="text-[10px]">{cargo.tipo}</Badge></TableCell>
                  <TableCell className="text-right font-black">{formatCurrency(cargo.custo_diario)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => { setEditingCargo(cargo); setIsDialogOpen(true); }}><Edit className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(cargo.id)} className="text-destructive"><Trash2 className="w-4 h-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
};

export default CargosList;