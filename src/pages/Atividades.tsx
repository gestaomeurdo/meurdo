"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { useObras } from "@/hooks/use-obras";
import { useState, useEffect, useMemo } from "react";
import { Loader2, ClipboardList, Plus, Search, ListFilter, LayoutGrid, Layers, RefreshCcw, Construction, Trash2, X, CheckSquare } from "lucide-react";
import ObraSelector from "@/components/financeiro/ObraSelector";
import { useAtividades, useDeleteAtividade, useBulkDeleteAtividades, Atividade } from "@/hooks/use-atividades";
import AtividadeCard from "@/components/atividades/AtividadeCard";
import AtividadeDialog from "@/components/atividades/AtividadeDialog";
import AtividadeModelSelector from "@/components/atividades/AtividadeModelSelector";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { showSuccess, showError } from "@/utils/toast";
import { useQueryClient } from "@tanstack/react-query";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

const Atividades = () => {
  const queryClient = useQueryClient();
  const { data: obras, isLoading: isLoadingObras } = useObras();
  const [selectedObraId, setSelectedObraId] = useState<string | undefined>(undefined);
  const [filterEtapa, setFilterEtapa] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Seleção automática da primeira obra disponível
  useEffect(() => {
    if (obras && obras.length > 0 && !selectedObraId) {
      setSelectedObraId(obras[0].id);
    }
  }, [obras, selectedObraId]);

  // Hook de Atividades
  const { data: atividades, isLoading: isLoadingAtividades, status: atividadesStatus, refetch: refetchAtividades } = useAtividades(selectedObraId || '');
  const deleteMutation = useDeleteAtividade();
  const bulkDeleteMutation = useBulkDeleteAtividades();

  const isObraValid = selectedObraId && selectedObraId !== '00000000-0000-0000-0000-000000000000';

  const filteredAtividades = useMemo(() => {
    if (!atividades) return [];
    return atividades.filter(atv => {
      const matchesEtapa = filterEtapa === "all" || atv.etapa === filterEtapa;
      const matchesSearch = atv.descricao.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           atv.responsavel_nome?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesEtapa && matchesSearch;
    });
  }, [atividades, filterEtapa, searchQuery]);

  const groupedAtividades = useMemo(() => {
    const groups: Record<string, Atividade[]> = {};
    filteredAtividades.forEach(atv => {
      const etapa = atv.etapa || "Outros / Sem Etapa";
      if (!groups[etapa]) groups[etapa] = [];
      groups[etapa].push(atv);
    });
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [filteredAtividades]);

  const uniqueEtapas = useMemo(() => {
    if (!atividades) return [];
    const etapas = atividades.map(a => a.etapa).filter(Boolean) as string[];
    return Array.from(new Set(etapas)).sort();
  }, [atividades]);

  const handleSelect = (id: string, checked: boolean) => {
    setSelectedIds(prev => checked ? [...prev, id] : prev.filter(i => i !== id));
  };

  const handleBulkDelete = async () => {
    if (!selectedObraId || selectedIds.length === 0) return;
    try {
      await bulkDeleteMutation.mutateAsync({ ids: selectedIds, obraId: selectedObraId });
      showSuccess(`${selectedIds.length} atividades removidas.`);
      setSelectedIds([]);
    } catch (err) {
      showError("Erro ao remover atividades.");
    }
  };

  const renderContent = () => {
    if (isLoadingObras) {
      return (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      );
    }

    if (obras && obras.length === 0) {
      return (
        <div className="text-center py-20 border border-dashed rounded-2xl bg-muted/20">
          <Construction className="w-16 h-16 mx-auto text-primary/30 mb-4" />
          <h2 className="text-2xl font-bold mb-2">Nenhuma obra cadastrada</h2>
          <p className="text-muted-foreground mb-6">Cadastre uma obra para gerenciar o cronograma.</p>
          <Button asChild><a href="/obras">Ir para Minhas Obras</a></Button>
        </div>
      );
    }

    if (!selectedObraId) {
      return (
        <div className="text-center py-20 border border-dashed rounded-2xl bg-muted/10">
          <ClipboardList className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Selecione uma obra no menu acima.</p>
        </div>
      );
    }

    if (isLoadingAtividades && isObraValid) {
      return (
        <div className="flex flex-col justify-center items-center py-20 gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-sm font-medium animate-pulse">Sincronizando cronograma...</p>
        </div>
      );
    }

    if (atividadesStatus === 'success' && (!atividades || atividades.length === 0)) {
      return (
        <div className="text-center py-20 border border-dashed rounded-3xl bg-accent/5">
          <div className="bg-primary/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <ClipboardList className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-2xl font-black mb-2 uppercase tracking-tight">Cronograma Vazio</h2>
          <p className="text-muted-foreground mb-8 max-w-sm mx-auto">
            Inicie seu planejamento em segundos usando nossos modelos ou crie manualmente.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <AtividadeModelSelector obraId={selectedObraId} />
            <AtividadeDialog 
              obraId={selectedObraId} 
              trigger={
                <Button size="lg" variant="outline" className="rounded-2xl px-8 border-primary text-primary h-14 font-bold">
                  <Plus className="w-5 h-5 mr-2" />
                  Criar Manualmente
                </Button>
              } 
            />
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-card p-4 border rounded-2xl shadow-clean sticky top-20 z-10">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar atividade..." 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
              className="pl-9 bg-background" 
            />
          </div>
          <Select value={filterEtapa} onValueChange={setFilterEtapa}>
            <SelectTrigger className="bg-background">
              <div className="flex items-center">
                <ListFilter className="w-4 h-4 mr-2 text-primary" />
                <SelectValue placeholder="Todas as Etapas" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as Etapas</SelectItem>
              {uniqueEtapas.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
            </SelectContent>
          </Select>
          <div className="flex items-center justify-end gap-3">
            {selectedIds.length > 0 ? (
              <div className="flex items-center gap-2 animate-in slide-in-from-right-2">
                <span className="text-xs font-bold text-primary">{selectedIds.length} selecionados</span>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant="destructive" className="rounded-xl h-9 px-4">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Excluir
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="rounded-2xl">
                    <AlertDialogHeader>
                      <AlertDialogTitle>Excluir {selectedIds.length} atividades?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta ação é irreversível e removerá as atividades selecionadas do cronograma.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={handleBulkDelete} 
                        className="bg-destructive rounded-xl"
                      >
                        Confirmar Exclusão
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                <Button 
                  size="icon" 
                  variant="ghost" 
                  onClick={() => setSelectedIds([])} 
                  className="h-9 w-9 rounded-xl"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                {filteredAtividades.length} serviços
              </span>
            )}
          </div>
        </div>

        <div className="space-y-10">
          {groupedAtividades.map(([etapa, items]) => (
            <div key={etapa} className="space-y-4">
              <div className="flex items-center gap-3 pb-2 border-b">
                <Layers className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-black uppercase tracking-tight text-primary">{etapa}</h2>
                <span className="text-xs font-bold px-2 py-0.5 bg-accent text-primary rounded-full">
                  {items.length}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {items.map((atividade) => (
                  <AtividadeCard 
                    key={atividade.id} 
                    atividade={atividade}
                    isSelected={selectedIds.includes(atividade.id)}
                    onSelect={handleSelect}
                    onDelete={(id) => deleteMutation.mutateAsync({ id, obraId: selectedObraId! })}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-6">
          <div className="space-y-1">
            <h1 className="text-3xl font-black tracking-tight uppercase">Cadastro de Atividades</h1>
            <p className="text-sm text-muted-foreground">Banco de serviços para uso no RDO.</p>
          </div>
          <div className="flex flex-wrap gap-3 items-center">
            <ObraSelector selectedObraId={selectedObraId} onSelectObra={setSelectedObraId} />
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => {
                queryClient.invalidateQueries({ queryKey: ['atividades'] });
                refetchAtividades();
              }}
              className="rounded-xl"
              title="Recarregar Cronograma"
            >
              <RefreshCcw className="h-4 w-4" />
            </Button>
            {isObraValid && (
              <div className="flex items-center gap-2">
                <AtividadeModelSelector obraId={selectedObraId!} />
                <AtividadeDialog 
                  obraId={selectedObraId!} 
                  trigger={
                    <Button className="rounded-xl shadow-lg shadow-primary/20 font-bold bg-[#066abc] hover:bg-[#066abc]/90">
                      <Plus className="w-4 h-4 mr-2" />
                      Nova Atividade
                    </Button>
                  } 
                />
              </div>
            )}
          </div>
        </div>
        {renderContent()}
      </div>
    </DashboardLayout>
  );
};

export default Atividades;