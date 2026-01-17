"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { useObras } from "@/hooks/use-obras";
import { useState, useEffect, useMemo } from "react";
import { Loader2, ClipboardList, Plus, Search, ListFilter, LayoutGrid, Layers, RefreshCcw, Construction, CheckCircle2 } from "lucide-react";
import ObraSelector from "@/components/financeiro/ObraSelector";
import { useAtividades, useDeleteAtividade, Atividade } from "@/hooks/use-atividades";
import AtividadeCard from "@/components/atividades/AtividadeCard";
import AtividadeDialog from "@/components/atividades/AtividadeDialog";
import AtividadeModelSelector from "@/components/atividades/AtividadeModelSelector";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { showSuccess, showError } from "@/utils/toast";
import { useQueryClient } from "@tanstack/react-query";

const Atividades = () => {
  const queryClient = useQueryClient();
  const { data: obras, isLoading: isLoadingObras, error: obrasError } = useObras();
  const [selectedObraId, setSelectedObraId] = useState<string | undefined>(undefined);
  const [filterEtapa, setFilterEtapa] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const isObraValid = selectedObraId && selectedObraId !== '00000000-0000-0000-0000-000000000000';
  const { 
    data: atividades, 
    isLoading: isLoadingAtividades,
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

    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [filteredAtividades]);

  const uniqueEtapas = useMemo(() => {
    if (!atividades) return [];
    const etapas = atividades.map(a => a.etapa).filter(Boolean) as string[];
    return Array.from(new Set(etapas)).sort();
  }, [atividades]);

  const handleManualRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['obras'] });
    if (selectedObraId) {
        queryClient.invalidateQueries({ queryKey: ['atividades', selectedObraId] });
    }
    showSuccess("Cronograma atualizado.");
  };

  const renderContent = () => {
    if (isLoadingObras) return <div className="flex justify-center items-center py-20"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;

    if (!selectedObraId) {
        return (
            <div className="text-center py-20 border border-dashed rounded-2xl bg-muted/20">
                <Construction className="w-16 h-16 mx-auto text-primary/30 mb-4" />
                <h2 className="text-2xl font-bold mb-2">Selecione uma Obra</h2>
                <p className="text-muted-foreground">Escolha uma obra no seletor para ver seu cronograma técnico.</p>
            </div>
        );
    }

    if (isLoadingAtividades) return <div className="flex justify-center items-center py-20"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;

    if (atividades && atividades.length === 0) {
        return (
            <div className="text-center py-20 border border-dashed rounded-3xl bg-accent/5">
                <div className="bg-primary/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <ClipboardList className="w-10 h-10 text-primary" />
                </div>
                <h2 className="text-2xl font-black mb-2 uppercase tracking-tight">Cronograma Vazio</h2>
                <p className="text-muted-foreground mb-8 max-w-sm mx-auto">
                    Inicie seu planejamento em segundos usando nossos modelos verificados ou crie manualmente.
                </p>
                <div className="flex flex-col sm:flex-row justify-center gap-4">
                    <AtividadeModelSelector 
                        obraId={selectedObraId!} 
                        className="bg-[#066abc] hover:bg-[#066abc]/90 text-white rounded-2xl px-8 h-14 shadow-xl shadow-primary/20 font-bold"
                    />
                    <AtividadeDialog obraId={selectedObraId!} trigger={
                        <Button size="lg" variant="outline" className="rounded-2xl px-8 border-primary text-primary hover:bg-primary/5 h-14 font-bold">
                            <Plus className="w-5 h-5 mr-2" />
                            Criar Manualmente
                        </Button>
                    } />
                </div>
                <div className="mt-8 flex justify-center gap-6 text-[10px] uppercase font-bold text-muted-foreground tracking-widest">
                    <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-green-500" /> Residencial</span>
                    <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-green-500" /> Empresarial</span>
                    <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-green-500" /> Industrial</span>
                </div>
            </div>
        );
    }

    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-card p-4 border rounded-2xl shadow-clean">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar atividade..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 bg-background" />
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
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{filteredAtividades.length} atividades</span>
          </div>
        </div>

        <div className="space-y-10">
            {groupedAtividades.map(([etapa, items]) => (
                <div key={etapa} className="space-y-4">
                    <div className="flex items-center gap-3 pb-2 border-b">
                        <Layers className="w-5 h-5 text-primary" />
                        <h2 className="text-lg font-black uppercase tracking-tight text-primary">{etapa}</h2>
                        <span className="text-xs font-bold px-2 py-0.5 bg-accent text-primary rounded-full">{items.length}</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {items.map((atividade) => (
                            <AtividadeCard key={atividade.id} atividade={atividade} onDelete={(id) => deleteMutation.mutateAsync({ id, obraId: selectedObraId! })} />
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
            <h1 className="text-3xl font-black tracking-tight uppercase">Cronograma de Obra</h1>
            <p className="text-sm text-muted-foreground">Planejamento e controle de avanço físico.</p>
          </div>
          <div className="flex flex-wrap gap-3 items-center">
            <ObraSelector selectedObraId={selectedObraId} onSelectObra={setSelectedObraId} />
            <Button variant="outline" size="icon" onClick={handleManualRefresh} className="rounded-xl">
                <RefreshCcw className="h-4 w-4" />
            </Button>
            {isObraValid && (
                <div className="flex items-center gap-2">
                    <AtividadeModelSelector obraId={selectedObraId!} />
                    <AtividadeDialog obraId={selectedObraId!} trigger={
                         <Button className="rounded-xl shadow-lg shadow-primary/20 font-bold bg-[#066abc] hover:bg-[#066abc]/90">
                            <Plus className="w-4 h-4 mr-2" /> Nova Atividade
                        </Button>
                    } />
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