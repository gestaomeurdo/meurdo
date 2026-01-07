import { useCargos, useDeleteCargo, Cargo } from "@/hooks/use-cargos";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Loader2, Users, FileUp, AlertTriangle } from "lucide-react";
import { formatCurrency } from "@/utils/formatters";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import CargoForm from "./CargoForm";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import CargoImportDialog from "./CargoImportDialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const CargosList = () => {
  const { data: cargos, isLoading, error } = useCargos();
  const deleteMutation = useDeleteCargo();
  const [editingCargo, setEditingCargo] = useState<Cargo | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  if (isLoading) {
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

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <h3 className="text-lg font-semibold flex items-center"><Users className="w-5 h-5 mr-2" /> Cargos Cadastrados</h3>
        <div className="flex gap-2">
          <CargoImportDialog trigger={
            <Button variant="outline" size="sm" className="flex items-center">
              <FileUp className="w-4 h-4 mr-2" /> Importar CSV
            </Button>
          } />
          
          <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) setEditingCargo(null); }}>
            <DialogTrigger asChild><Button size="sm">Novo Cargo</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{editingCargo ? "Editar Cargo" : "Cadastrar Novo Cargo"}</DialogTitle></DialogHeader>
              <CargoForm initialData={editingCargo || undefined} onSuccess={() => setIsDialogOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead className="text-right">Custo Diário</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cargos && cargos.length > 0 ? (
              cargos.map((cargo) => (
                <TableRow key={cargo.id}>
                  <TableCell className="font-medium">{cargo.nome}</TableCell>
                  <TableCell><Badge variant={cargo.tipo === 'Próprio' ? "default" : "secondary"}>{cargo.tipo}</Badge></TableCell>
                  <TableCell className="text-right font-semibold">{formatCurrency(cargo.custo_diario)}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="ghost" size="icon" onClick={() => { setEditingCargo(cargo); setIsDialogOpen(true); }}><Edit className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(cargo.id)} className="text-destructive hover:bg-destructive/10"><Trash2 className="w-4 h-4" /></Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Nenhum cargo cadastrado. Use o botão acima para adicionar.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default CargosList;