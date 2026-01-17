"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { useObras } from "@/hooks/use-obras";
import { useState, useEffect, useMemo } from "react";
import { Loader2, ClipboardList, Plus, FileDown, LayoutGrid, ListFilter, Search, X } from "lucide-react";
import ObraSelector from "@/components/financeiro/ObraSelector";
import { useAtividades, useDeleteAtividade } from "@/hooks/use-atividades";
import AtividadeCard from "@/components/atividades/AtividadeCard";
import AtividadeDialog from "@/components/atividades/AtividadeDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { showSuccess, showError } from "@/utils/toast";

const Atividades = () => {
  const { data: obras, isLoading: isLoadingObras } = useObras();
  const [selectedObraId, setSelectedObraId] = useState<string | undefined>(undefined);
  const [filterEtapa, setFilterEtapa] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: atividades, isLoading: isLoadingAtividades } = useAtividades(selectedObraId || '');
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

  const uniqueEtapas = useMemo(() => {
    if (!atividades) return [];
    const etapas = atividades.map(a => a.etapa).filter(Boolean) as string[];
    return Array.from(new Set(etapas));
  }, [atividades]);

  const handleDelete = async (id: string) => {
    if (!selectedObraId) return;
    try {
      await deleteMutation.mutateAsync({ id, obraId: selectedObraId });
      showSuccess("Atividade removida do cronograma.");
    } catch (err) {
      showError("Erro ao remover atividade.");
    }
  };

  const renderContent = () => {
    if (isLoadingObras) return <div className="flex justify-center items-center py-20"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
    if (!selectedObraId) return <div className="text-center py-20 border border-dashed rounded-2xl bg-muted/20"><ClipboardList className="w-12 h-12 mx-auto text-muted-foreground mb-4" /><p className="text-muted-foreground">Selecione uma obra para gerenciar o planejamento.</p></div>;
    if (isLoadingAtividades) return <div className="flex justify-center items-center py-20"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;

    return (
      <div className="space-y-6">
        {/* Barra de Filtros */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-card p-4 border rounded-2xl shadow-clean">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar por nome ou responsável..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={filterEtapa} onValueChange={setFilterEtapa}>
            <SelectTrigger>
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
          <div className="flex justify-end items-center">
            <span className="text-xs font-bold text-muted-foreground uppercase">{filteredAtividades.length} atividades encontradas</span>
          </div>
        </div>

        {filteredAtividades.length === 0 ? (
          <div className="text-center py-20 border border-dashed rounded-2xl bg-muted/10">
            <LayoutGrid className="w-12 h-12 mx-auto text-primary/20 mb-4" />
            <h2 className="text-xl font-bold mb-2">Nenhuma atividade no cronograma</h2>
            <p className="text-muted-foreground mb-6">Cadastre as atividades previstas para esta obra para gerenciar o progresso.</p>
            <AtividadeDialog obraId={selectedObraId} />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredAtividades.map((atividade) => (
              <AtividadeCard 
                key={atividade.id} 
                atividade={atividade} 
                onDelete={handleDelete}
              />
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
            <h1 className="text-3xl font-black tracking-tight">Atividades na Obra</h1>
            <p className="text-sm text-muted-foreground">Gestão de progresso físico e cronograma técnico.</p>
          </div>
          <div className="flex flex-wrap gap-3 items-center">
            <ObraSelector 
              selectedObraId={selectedObraId} 
              onSelectObra={setSelectedObraId} 
            />
            <AtividadeDialog 
              obraId={selectedObraId || ''} 
              trigger={
                <Button className="rounded-xl shadow-lg shadow-primary/20">
                  <Plus className="w-4 h-4 mr-2" /> Nova Atividade
                </Button>
              }
            />
          </div>
        </div>
        {renderContent()}
      </div>
    </DashboardLayout>
  );
};

export default Atividades;