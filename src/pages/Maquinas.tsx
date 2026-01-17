import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Truck, Plus, Trash2, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useMaquinas, useCreateMaquina, useDeleteMaquina } from "@/hooks/use-maquinas";
import { useState } from "react";
import { showSuccess, showError } from "@/utils/toast";
import { formatCurrency } from "@/utils/formatters";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

const Maquinas = () => {
  const { data: maquinas, isLoading } = useMaquinas();
  const createMutation = useCreateMaquina();
  const deleteMutation = useDeleteMaquina();
  const [isOpen, setIsOpen] = useState(false);
  
  const [nome, setNome] = useState("");
  const [custo, setCusto] = useState("");

  const handleSave = async () => {
    if (!nome || !custo) return;
    try {
      await createMutation.mutateAsync({
        nome,
        custo_hora: parseFloat(custo.replace(',', '.'))
      });
      showSuccess("Máquina cadastrada!");
      setIsOpen(false);
      setNome("");
      setCusto("");
    } catch (e) {
      showError("Erro ao salvar.");
    }
  };

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 space-y-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-black uppercase tracking-tight">Frota & Equipamentos</h1>
          <p className="text-sm text-muted-foreground">Cadastre o valor hora das máquinas para o RDO.</p>
        </div>

        <Card className="shadow-clean border-none rounded-3xl overflow-hidden">
          <CardHeader className="bg-muted/30 pb-6 flex flex-row items-center justify-between">
            <div>
                <CardTitle className="flex items-center gap-2 text-xl font-bold">
                <Truck className="w-6 h-6 text-[#066abc]" />
                Banco de Equipamentos
                </CardTitle>
                <CardDescription>
                Valores utilizados para calcular custo de maquinário no diário.
                </CardDescription>
            </div>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogTrigger asChild>
                    <Button><Plus className="w-4 h-4 mr-2" /> Nova Máquina</Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader><DialogTitle>Cadastrar Equipamento</DialogTitle></DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Nome do Equipamento</Label>
                            <Input placeholder="Ex: Retroescavadeira JCB" value={nome} onChange={e => setNome(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>Custo Hora (R$)</Label>
                            <Input type="number" placeholder="0.00" value={custo} onChange={e => setCusto(e.target.value)} />
                        </div>
                        <Button onClick={handleSave} className="w-full" disabled={createMutation.isPending}>
                            {createMutation.isPending ? <Loader2 className="animate-spin" /> : "Salvar"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent className="pt-0">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Equipamento</TableHead>
                        <TableHead>Custo Hora</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {maquinas?.map((m) => (
                        <TableRow key={m.id}>
                            <TableCell className="font-medium">{m.nome}</TableCell>
                            <TableCell>{formatCurrency(m.custo_hora)} / h</TableCell>
                            <TableCell className="text-right">
                                <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(m.id)}>
                                    <Trash2 className="w-4 h-4 text-destructive" />
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                    {maquinas?.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">Nenhuma máquina cadastrada.</TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Maquinas;