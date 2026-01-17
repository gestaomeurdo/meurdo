import DashboardLayout from "@/components/layout/DashboardLayout";
import { useState, useEffect } from "react";
import { useObras } from "@/hooks/use-obras";
import ObraSelector from "@/components/financeiro/ObraSelector";
import { Card, CardContent } from "@/components/ui/card";
import { useMaterialReceipts, useDeleteReceipt } from "@/hooks/use-material-receipts";
import MaterialReceiptDialog from "@/components/materiais/MaterialReceiptDialog";
import { Loader2, Package, Truck, Calendar, Trash2, ImageIcon, Search, Info, AlertTriangle, RefreshCcw } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { showSuccess, showError } from "@/utils/toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

const Materiais = () => {
  const { data: obras, isLoading: isLoadingObras, error: obrasError } = useObras();
  const [selectedObraId, setSelectedObraId] = useState<string | undefined>(undefined);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (obras && obras.length > 0 && !selectedObraId) {
      setSelectedObraId(obras[0].id);
    }
  }, [obras, selectedObraId]);

  const { 
    data: receipts, 
    isLoading: isLoadingReceipts, 
    isFetching: isFetchingReceipts,
    error: receiptsError,
    refetch 
  } = useMaterialReceipts(selectedObraId);
  
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
    if (isLoadingObras) {
      return (
        <div className="flex flex-col justify-center items-center py-20 gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-muted-foreground animate-pulse font-medium">Buscando suas obras...</p>
        </div>
      );
    }

    if (obrasError || receiptsError) {
      return (
        <Alert variant="destructive" className="mt-6 border-2">
          <AlertTriangle className="h-5 w-5" />
          <AlertTitle className="font-bold">Falha na Sincronização</AlertTitle>
          <AlertDescription className="flex flex-col gap-4 mt-2">
            <p className="text-sm">O sistema não conseguiu conectar com o banco de dados de materiais. Isso pode ser um problema de permissão ou conexão.</p>
            <div className="bg-black/5 p-3 rounded font-mono text-[10px] break-all">
                ERRO: {receiptsError?.message || obrasError?.message || "Erro desconhecido"}
            </div>
            <Button variant="outline" size="sm" onClick={() => refetch()} className="w-fit bg-white">
              <RefreshCcw className="w-4 h-4 mr-2" /> Tentar Reconectar
            </Button>
          </AlertDescription>
        </Alert>
      );
    }

    if (obras && obras.length === 0) {
      return (
        <Card className="border-dashed py-20 text-center shadow-none bg-muted/20 rounded-3xl">
          <CardContent>
            <Package className="w-12 h-12 mx-auto text-primary/30 mb-4" />
            <h2 className="text-xl font-bold mb-2">Nenhuma obra cadastrada</h2>
            <p className="text-muted-foreground mb-6">Você precisa cadastrar uma obra antes de gerenciar materiais.</p>
            <Button asChild className="rounded-xl"><a href="/obras">Cadastrar Primeira Obra</a></Button>
          </CardContent>
        </Card>
      );
    }

    if (!selectedObraId) {
        return (
            <div className="text-center py-20 border border-dashed rounded-3xl bg-muted/10">
                <Package className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground font-medium">Selecione uma obra no menu acima para gerenciar os materiais.</p>
            </div>
        );
    }

    return (
      <div className="space-y-6">
        <Alert className="bg-primary/5 border-primary/20 rounded-2xl">
          <Info className="h-4 w-4 text-primary" />
          <AlertTitle className="text-primary font-bold">Automação de Diário</AlertTitle>
          <AlertDescription className="text-xs">
            Materiais registrados aqui são importados automaticamente para o **RDO** da respectiva data.
          </AlertDescription>
        </Alert>

        <div className="flex flex-col sm:flex-row justify-between gap-4 items-center bg-card p-4 border rounded-2xl shadow-sm">
            <div className="relative w-full sm:max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                    placeholder="Buscar material ou fornecedor..." 
                    className="pl-9 bg-background rounded-xl border-muted-foreground/20" 
                    value={search} 
                    onChange={(e) => setSearch(e.target.value)} 
                />
            </div>
            <MaterialReceiptDialog obraId={selectedObraId} />
        </div>

        {(isLoadingReceipts || isFetchingReceipts) && !receipts ? (
            <div className="flex flex-col justify-center items-center py-20 gap-4">
                <div className="relative">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                    <Package className="h-5 w-5 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                </div>
                <p className="text-sm font-bold text-primary animate-pulse uppercase tracking-widest">Sincronizando Estoque...</p>
            </div>
        ) : filteredReceipts && filteredReceipts.length === 0 ? (
            <div className="text-center py-24 bg-muted/5 rounded-3xl border-2 border-dashed border-muted-foreground/20">
                <Truck className="w-16 h-16 mx-auto text-muted-foreground/20 mb-4" />
                <h3 className="text-lg font-bold text-muted-foreground">Nenhum registro encontrado</h3>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto mt-1">
                    {search ? "Não encontramos nada com esse termo de busca." : "Comece registrando o primeiro recebimento de material para esta obra."}
                </p>
                {search && <Button variant="link" onClick={() => setSearch("")} className="mt-2 text-primary font-bold">Limpar Busca</Button>}
            </div>
        ) : (
            <div className="grid grid-cols-1 gap-4">
                {filteredReceipts?.map((receipt) => (
                    <Card key={receipt.id} className="overflow-hidden hover:shadow-md transition-all border-l-4 border-l-primary shadow-clean rounded-2xl group">
                        <CardContent className="p-4 sm:p-6">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                <div className="flex items-start gap-4">
                                    <div className="w-16 h-16 rounded-xl bg-accent/50 flex items-center justify-center shrink-0 overflow-hidden border border-primary/10 shadow-inner group-hover:border-primary/30 transition-colors">
                                        {receipt.foto_url ? (
                                            <a href={receipt.foto_url} target="_blank" rel="noreferrer" className="w-full h-full">
                                                <img src={receipt.foto_url} alt="NF" className="w-full h-full object-cover" />
                                            </a>
                                        ) : (
                                            <Package className="w-7 h-7 text-primary/60" />
                                        )}
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex items-center flex-wrap gap-2">
                                            <h3 className="font-black text-lg leading-tight uppercase tracking-tight">{receipt.material}</h3>
                                            <Badge className={cn("text-[10px] font-black px-2 rounded-full uppercase tracking-wider", 
                                                receipt.status === 'Conforme' ? "bg-green-600 text-white" : "bg-destructive text-white")}>
                                                {receipt.status}
                                            </Badge>
                                        </div>
                                        <p className="text-sm text-primary font-black uppercase tracking-widest">{receipt.quantidade} {receipt.unidade}</p>
                                        <div className="flex flex-wrap gap-x-4 gap-y-2 text-[11px] text-muted-foreground pt-1">
                                            <span className="flex items-center gap-1.5 font-bold uppercase"><Truck className="w-3.5 h-3.5 text-primary" /> {receipt.fornecedor || 'N/A'}</span>
                                            <span className="flex items-center gap-1.5 font-bold uppercase"><Calendar className="w-3.5 h-3.5 text-primary" /> {format(new Date(receipt.data_recebimento), 'dd/MM/yyyy', { locale: ptBR })}</span>
                                            {receipt.numero_nf && <span className="flex items-center gap-1.5 font-mono font-black uppercase bg-primary/10 text-primary px-2 py-0.5 rounded">NF: {receipt.numero_nf}</span>}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 self-end sm:self-center">
                                    {receipt.foto_url && (
                                        <Button variant="ghost" size="icon" asChild title="Ver Comprovante" className="rounded-full h-10 w-10 hover:bg-primary/10">
                                            <a href={receipt.foto_url} target="_blank" rel="noreferrer"><ImageIcon className="w-5 h-5 text-primary" /></a>
                                        </Button>
                                    )}
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10 rounded-full h-10 w-10"><Trash2 className="w-5 h-5" /></Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent className="rounded-3xl border-2">
                                            <AlertDialogHeader>
                                                <AlertDialogTitle className="text-xl font-black uppercase tracking-tight">Remover registro?</AlertDialogTitle>
                                                <AlertDialogDescription className="text-sm font-medium">
                                                    Esta ação apagará o histórico deste recebimento definitivamente.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter className="gap-2">
                                                <AlertDialogCancel className="rounded-xl border-2">Cancelar</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleDelete(receipt.id)} className="bg-destructive rounded-xl hover:bg-destructive/90 font-bold uppercase tracking-widest text-xs">Excluir Permanente</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        )}
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 space-y-6 animate-in fade-in duration-700">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-black tracking-tighter uppercase text-foreground">Materiais & Insumos</h1>
          <p className="text-sm text-muted-foreground font-medium">Controle de recebimentos, qualidade e histórico de entregas.</p>
        </div>

        <div className="w-full sm:max-w-sm">
            <ObraSelector selectedObraId={selectedObraId} onSelectObra={setSelectedObraId} />
        </div>

        {renderContent()}
      </div>
    </DashboardLayout>
  );
};

export default Materiais;