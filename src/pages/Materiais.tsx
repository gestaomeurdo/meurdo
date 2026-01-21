import DashboardLayout from "@/components/layout/DashboardLayout";
import { useState, useEffect } from "react";
import { useObras } from "@/hooks/use-obras";
import ObraSelector from "@/components/financeiro/ObraSelector";
import { Card, CardContent } from "@/components/ui/card";
import { useMaterialReceipts, useDeleteReceipt } from "@/hooks/use-material-receipts";
import MaterialReceiptDialog from "@/components/materiais/MaterialReceiptDialog";
import { Package, Truck, Calendar, Trash2, Edit, Search, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { showSuccess, showError } from "@/utils/toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const ReceiptSkeleton = () => (
  <div className="space-y-4">
    {[1, 2, 3].map(i => (
      <Card key={i} className="rounded-2xl border-none shadow-clean overflow-hidden">
        <CardContent className="p-6">
          <div className="flex gap-4">
            <Skeleton className="h-16 w-16 rounded-xl shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-4 w-1/4" />
            </div>
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
);

const Materiais = () => {
  const { data: obras, isLoading: isLoadingObras, error: obrasError } = useObras();
  const [selectedObraId, setSelectedObraId] = useState<string | undefined>(undefined);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (obras && obras.length > 0 && !selectedObraId) {
      setSelectedObraId(obras[0].id);
    }
  }, [obras, selectedObraId]);

  const { data: receipts, isLoading: isLoadingReceipts, error: receiptsError, refetch } = useMaterialReceipts(selectedObraId);
  const deleteMutation = useDeleteReceipt();

  const filteredReceipts = receipts?.filter(r =>
    r.material.toLowerCase().includes(search.toLowerCase()) ||
    r.fornecedor?.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (id: string) => {
    if (!selectedObraId) return;
    try {
      await deleteMutation.mutateAsync({ id, obraId: selectedObraId });
      showSuccess("Registro de material excluído.");
    } catch (err) {
      showError("Erro ao excluir.");
    }
  };

  const renderContent = () => {
    if (isLoadingObras) return <ReceiptSkeleton />;
    if (!selectedObraId) return <div className="text-center py-20 text-muted-foreground font-bold uppercase tracking-widest text-xs">Selecione uma obra.</div>;
    if (isLoadingReceipts && !receipts) return <ReceiptSkeleton />;

    if (filteredReceipts && filteredReceipts.length === 0) {
      return (
        <div className="text-center py-20 border border-dashed rounded-3xl bg-muted/10">
          <Truck className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground">Nenhum material encontrado.</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 gap-4">
        {filteredReceipts?.map((receipt) => (
          <Card key={receipt.id} className="hover:shadow-md transition-all border-l-4 border-l-primary shadow-clean rounded-2xl overflow-hidden">
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-xl bg-accent/50 flex items-center justify-center shrink-0 overflow-hidden border">
                    {receipt.foto_url ? (
                      <img src={receipt.foto_url} alt="Material" className="w-full h-full object-cover" />
                    ) : (
                      <Package className="w-7 h-7 text-primary/60" />
                    )}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center flex-wrap gap-2">
                      <h3 className="font-black text-lg uppercase tracking-tight">{receipt.material}</h3>
                      <Badge className={cn("text-[10px] font-black px-2 rounded-full uppercase", receipt.status === 'Conforme' ? "bg-green-600" : "bg-destructive")}>
                        {receipt.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-primary font-black uppercase">{receipt.quantidade} {receipt.unidade}</p>
                    <div className="flex flex-wrap gap-x-4 text-[11px] text-muted-foreground font-bold uppercase">
                      <span className="flex items-center gap-1.5"><Truck className="w-3.5 h-3.5" />{receipt.fornecedor || 'N/A'}</span>
                      <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />{format(new Date(receipt.data_recebimento + 'T12:00:00'), 'dd/MM/yyyy')}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <MaterialReceiptDialog 
                    obraId={selectedObraId} 
                    initialData={receipt} 
                    trigger={<Button variant="ghost" size="icon" className="text-primary rounded-full"><Edit className="w-5 h-5" /></Button>}
                  />
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-destructive rounded-full"><Trash2 className="w-5 h-5" /></Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="rounded-3xl">
                      <AlertDialogHeader><AlertDialogTitle>Remover registro?</AlertDialogTitle></AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(receipt.id)} className="bg-destructive rounded-xl">Excluir</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 space-y-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-black uppercase tracking-tighter">Materiais & Insumos</h1>
          <p className="text-sm text-muted-foreground">Controle de recebimentos e qualidade.</p>
        </div>
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <ObraSelector selectedObraId={selectedObraId} onSelectObra={setSelectedObraId} />
          <MaterialReceiptDialog obraId={selectedObraId || ''} />
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar material ou fornecedor..." className="pl-9 rounded-xl" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        {renderContent()}
      </div>
    </DashboardLayout>
  );
};

export default Materiais;