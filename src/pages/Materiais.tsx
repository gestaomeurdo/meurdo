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
    error: receiptsError,
    refetch 
  } = useMaterialReceipts(selectedObraId || '');
  
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
          <p className="text-muted-foreground animate-pulse">Buscando suas obras...</p>
        </div>
      );
    }

    if (obrasError || receiptsError) {
      return (
        <Alert variant="destructive" className="mt-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Erro na Conexão</AlertTitle>
          <AlertDescription className="flex flex-col gap-3">
            <p>Não foi possível carregar os dados. Verifique sua internet ou permissões de acesso.</p>
            <Button variant="outline" size="sm" onClick={() => refetch()} className="w-fit">
              <RefreshCcw className="w-4 h-4 mr-2" /> Tentar Novamente
            </Button>
          </AlertDescription>
        </Alert>
      );
    }

    if (!selectedObraId && obras && obras.length > 0) {
        return (
            <div className="text-center py-20 border border-dashed rounded-2xl bg-muted/10">
                <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Selecione uma obra no menu acima para ver os materiais.</p>
            </div>
        );
    }

    if (obras && obras.length === 0) {
      return (
        <Card className="border-dashed py-20 text-center shadow-none bg-muted/20">
          <CardContent>
            <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-bold mb-2">Nenhuma obra cadastrada</h2>
            <p className="text-muted-foreground mb-6">Você precisa cadastrar uma obra antes de gerenciar materiais.</p>
            <Button asChild><a href="/obras">Cadastrar Primeira Obra</a></Button>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="space-y-6">
        <Alert className="bg-primary/5 border-primary/20">
          <Info className="h-4 w-4 text-primary" />
          <AlertTitle className="text-primary font-bold">Automação Inteligente</AlertTitle>
          <AlertDescription>
            Tudo o que você receber aqui aparecerá **automaticamente** no seu Diário de Obra (RDO) do dia, sem precisar digitar duas vezes.
          </AlertDescription>
        </Alert>

        <div className="flex flex-col sm:flex-row justify-between gap-4 items-center">
            <div className="relative w-full sm:max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Buscar material ou fornecedor..." className="pl-9 bg-background rounded-xl" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <MaterialReceiptDialog obraId={selectedObraId!} />
        </div>

        {isLoadingReceipts ? (
            <div className="flex flex-col justify-center items-center py-20 gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-xs text-muted-foreground">Sincronizando estoque...</p>
            </div>
        ) : filteredReceipts && filteredReceipts.length === 0 ? (
            <div className="text-center py-20 bg-muted/10 rounded-3xl border-2 border-dashed">
                <Truck className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground">Nenhum recebimento registrado para esta obra.</p>
            </div>
        ) : (
            <div className="grid grid-cols-1 gap-4">
                {filteredReceipts?.map((receipt) => (
                    <Card key={receipt.id} className="overflow-hidden hover:shadow-md transition-all border-l-4 border-l-primary shadow-clean rounded-2xl">
                        <CardContent className="p-4 sm:p-6">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                <div className="flex items-start gap-4">
                                    <div className="w-14 h-14 rounded-xl bg-accent/50 flex items-center justify-center shrink-0 overflow-hidden border">
                                        {receipt.foto_url ? (
                                            <a href={receipt.foto_url} target="_blank" rel="noreferrer" className="w-full h-full">
                                                <img src={receipt.foto_url} alt="NF" className="w-full h-full object-cover" />
                                            </a>
                                        ) : (
                                            <Package className="w-6 h-6 text-primary" />
                                        )}
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-bold text-lg leading-tight">{receipt.material}</h3>
                                            <Badge className={cn("text-[10px] uppercase font-black px-2 rounded-full", 
                                                receipt.status === 'Conforme' ? "bg-green-600 text-white" : "bg-destructive text-white")}>
                                                {receipt.status}
                                            </Badge>
                                        </div>
                                        <p className="text-sm text-primary font-black uppercase tracking-wider">{receipt.quantidade} {receipt.unidade}</p>
                                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                                            <span className="flex items-center gap-1 font-medium"><Truck className="w-3 h-3" /> {receipt.fornecedor || 'N/A'}</span>
                                            <span className="flex items-center gap-1 font-medium"><Calendar className="w-3 h-3" /> {format(new Date(receipt.data_recebimento), 'dd/MM/yyyy', { locale: ptBR })}</span>
                                            {receipt.numero_nf && <span className="flex items-center gap-1 font-mono uppercase bg-accent px-1 rounded text-[10px]">NF: {receipt.numero_nf}</span>}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 self-end sm:self-center">
                                    {receipt.foto_url && (
                                        <Button variant="ghost" size="icon" asChild title="Ver Comprovante" className="rounded-full">
                                            <a href={receipt.foto_url} target="_blank" rel="noreferrer"><ImageIcon className="w-4 h-4 text-primary" /></a>
                                        </Button>
                                    )}
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10 rounded-full"><Trash2 className="w-4 h-4" /></Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent className="rounded-2xl">
                                            <AlertDialogHeader><AlertDialogTitle>Remover registro?</AlertDialogTitle><AlertDialogDescription>Esta ação apagará o histórico deste recebimento de material definitivamente.</AlertDialogDescription></AlertDialogHeader>
                                            <AlertDialogFooter><AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => handleDelete(receipt.id)} className="bg-destructive rounded-xl">Confirmar Exclusão</AlertDialogAction></AlertDialogFooter>
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
      <div className="p-4 sm:p-6 space-y-6 animate-in fade-in duration-500">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-black tracking-tight uppercase text-foreground">Controle de Materiais</h1>
          <p className="text-sm text-muted-foreground">Gestão de entradas, fornecedores e conformidade técnica.</p>
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