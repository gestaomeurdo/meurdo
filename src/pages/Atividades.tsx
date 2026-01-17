"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { useObras } from "@/hooks/use-obras";
import { useState, useEffect, useMemo } from "react";
import { Loader2, ClipboardList, Plus, Search, ListFilter, LayoutGrid, Layers, AlertTriangle } from "lucide-react";
import ObraSelector from "@/components/financeiro/ObraSelector";
import { useAtividades, useDeleteAtividade, Atividade } from "@/hooks/use-atividades";
import AtividadeCard from "@/components/atividades/AtividadeCard";
import AtividadeDialog from "@/components/atividades/AtividadeDialog";
import AtividadeModelSelector from "@/components/atividades/AtividadeModelSelector";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { showSuccess, showError } from "@/utils/toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const Atividades = () => {
  const { data: obras, isLoading: isLoadingObras, error: obrasError } = useObras();
  const [selectedObraId, setSelectedObraId] = useState<string | undefined>(undefined);
  const [filterEtapa, setFilterEtapa] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Só habilita a busca de atividades se houver uma obra selecionada
  const { 
    data: atividades, 
    isLoading: isLoadingAtividades, 
    error: atividadesError,
    isError: hasAtividadesError
  } = useAtividades(selectedObraId || '');
  
  const deleteMutation = useDeleteAtividade();

  useEffect(() => {
    if (obras && obras.length > 0 && !selectedObraId) {
      setSelectedObraId(obras[0].id);
    }
  }, [obras, selectedObraId]);

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

    return Object.entries(groups).sort(([a], [b]) => {
        const order = ["Preliminares", "Fundação", "Estrutura", "Alvenaria", "Elétricas", "Hidráulicas", "Revestimento", "Acabamento"];
        const indexA = order.findIndex(o => a.toLowerCase().includes(o.toLowerCase()));
        const indexB = order.findIndex(o => b.toLowerCase().includes(o.toLowerCase()));
        if (indexA !== -1 && indexB !== -1) return indexA - indexB;
        if (indexA !== -1) return -1;
        if (indexB !== -1) return 1;
        return a.localeCompare(b);
    });
  }, [filteredAtividades]);

  const uniqueEtapas = useMemo(() => {
    if (!atividades) return [];
    const etapas = atividades.map(a => a.etapa).filter(Boolean) as string[];
    return Array.from(new Set(etapas)).sort();
  }, [atividades]);

  const handleDelete = async (id: string) => {
    if (!selectedObraId) return;
    try {
      await deleteMutation.mutateAsync({ id, obraId: selectedObraId });
      showSuccess("Atividade removida.");
    } catch (err) {
      showError("Erro ao remover atividade.");
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

    if (obrasError) {
      return (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Erro ao carregar obras</AlertTitle>
          <AlertDescription>Não foi possível conectar ao servidor. Tente recarregar a página.</AlertDescription>
        </Alert>
      );
    }

    if (!selectedObraId) {
      return (
        <div className="text-center py-20 border border-dashed rounded-2xl bg-muted/20">
          <ClipboardList className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-bold mb-2">Nenhuma obra selecionada</h2>
          <p className="text-muted-foreground">Selecione uma obra no seletor acima para ver o cronograma.</p>
        </div>
      );
    }

    if (isLoadingAtividades) {
      return (
        <div className="flex flex-col justify-center items-center py-20 gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-muted-foreground animate-pulse">Carregando cronograma da obra...</p>
        </div>
      );
    }

    if (hasAtividadesError) {
      return (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Erro no Cronograma</AlertTitle>
          <AlertDescription>
            {atividadesError instanceof Error ? atividadesError.message : "Erro ao buscar atividades desta obra."}
          </AlertDescription>
        </Alert>
      );
    }

    return (
      <div className="space-y-8">
        {/* Barra de Filtros */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-card p-4 border rounded-2xl shadow-clean">
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
          <div className="flex justify-end items-center px-2">
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{filteredAtividades.length} atividades filtradas</span>
          </div>
        </div>

        {atividades && atividades.length === 0 ? (
          <div className="text-center py-20 border border-dashed rounded-2xl bg-muted/10">
            <LayoutGrid className="w-12 h-12 mx-auto text-primary/20 mb-4" />
            <h2 className="text-xl font-bold mb-2">Cronograma Vazio</h2>
            <p className="text-muted-foreground mb-6">Comece agora importando um modelo técnico ou criando uma atividade.</p>
            <div className="flex justify-center gap-3">
              <AtividadeModelSelector obraId={selectedObraId} />
              <AtividadeDialog obraId={selectedObraId} />
            </div>
          </div>
        ) : (
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
                                onDelete={handleDelete}
                            />
                        ))}
                    </div>
                </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-black tracking-tight uppercase">Cronograma de Obra</h1>
            <p className="text-sm text-muted-foreground">Planejamento técnico e avanço físico.</p>
          </div>
          <div className="flex flex-wrap gap-3 items-center">
            <ObraSelector 
              selectedObraId={selectedObraId} 
              onSelectObra={setSelectedObraId} 
            />
            {selectedObraId && (
                <div className="flex items-center gap-2">
                    <AtividadeModelSelector obraId={selectedObraId} />
                    <AtividadeDialog 
                        obraId={selectedObraId} 
                        trigger={
                            <Button className="rounded-xl shadow-lg shadow-primary/20">
                            <Plus className="w-4 h-4 mr-2" /> Nova Atividade
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