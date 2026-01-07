import { useCargos, useDeleteCargo, Cargo } from "@/hooks/use-cargos";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Loader2, Users } from "lucide-react";
import { formatCurrency } from "@/utils/formatters";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import CargoForm from "./CargoForm";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";

const CargosList = () => {
  const { data: cargos, isLoading } = useCargos();
  const deleteMutation = useDeleteCargo();
  const [editingCargo, setEditingCargo] = useState<Cargo | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  if (isLoading) return <Loader2 className="h-8 w-8 animate-spin text-primary" />;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold flex items-center"><Users className="w-5 h-5 mr-2" /> Cargos Cadastrados</h3>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) setEditingCargo(null); }}>
          <DialogTrigger asChild><Button size="sm">Novo Cargo</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editingCargo ? "Editar Cargo" : "Cadastrar Novo Cargo"}</DialogTitle></DialogHeader>
            <CargoForm initialData={editingCargo || undefined} onSuccess={() => setIsDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead className="text-right">Custo Diário</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cargos?.map((cargo) => (
              <TableRow key={cargo.id}>
                <TableCell className="font-medium">{cargo.nome}</TableCell>
                <TableCell><Badge variant={cargo.tipo === 'Próprio' ? "default" : "secondary"}>{cargo.tipo}</Badge></TableCell>
                <TableCell className="text-right">{formatCurrency(cargo.custo_diario)}</TableCell>
                <TableCell className="text-right space-x-2">
                  <Button variant="ghost" size="icon" onClick={() => { setEditingCargo(cargo); setIsDialogOpen(true); }}><Edit className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(cargo.id)} className="text-destructive"><Trash2 className="w-4 h-4" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default CargosList;