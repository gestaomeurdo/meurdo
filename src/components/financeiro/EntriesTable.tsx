"use client";

import { useState, useMemo } from "react";
import { FinancialEntry, useDeleteFinancialEntry, FinancialEntriesResult } from "@/hooks/use-financial-entries";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Loader2, CalendarIcon, Search, X, MoreHorizontal, ReceiptText } from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import EntryDialog from "./EntryDialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useExpenseCategories } from "@/hooks/use-expense-categories";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { formatCurrency, formatDate } from "@/utils/formatters";
import { Checkbox } from "@/components/ui/checkbox";
import BulkUpdateDialog from "./BulkUpdateDialog";
import BulkCategoryUpdateDialog from "./BulkCategoryUpdateDialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useIsMobile } from "@/hooks/use-mobile";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Card, CardContent } from "@/components/ui/card";

interface EntriesTableProps {
  entriesResult: FinancialEntriesResult | undefined;
  obraId: string;
  isLoading: boolean;
  refetch: () => void;
  setFilters: (filters: any) => void;
  currentFilters: any;
}

const EntriesTable = ({ entriesResult, obraId, isLoading, refetch, setFilters, currentFilters }: EntriesTableProps) => {
  const entries = entriesResult?.entries;
  const deleteMutation = useDeleteFinancialEntry();
  const { data: categories } = useExpenseCategories();
  const isMobile = useIsMobile();

  const [dateRange, setDateRange] = useState<{ from: Date | undefined, to: Date | undefined }>({
    from: currentFilters.startDate ? new Date(currentFilters.startDate) : undefined,
    to: currentFilters.endDate ? new Date(currentFilters.endDate) : undefined
  });
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(currentFilters.categoryId);
  const [searchText, setSearchText] = useState<string>('');
  const [selectedEntryIds, setSelectedEntryIds] = useState<string[]>([]);

  const handleSelectEntry = (id: string, checked: boolean) => {
    setSelectedEntryIds(prev => checked ? [...prev, id] : prev.filter(entryId => entryId !== id));
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked && entries) {
      setSelectedEntryIds(filteredEntries.map(entry => entry.id));
    } else {
      setSelectedEntryIds([]);
    }
  };

  const handleBulkUpdateSuccess = () => {
    setSelectedEntryIds([]);
    refetch();
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync({ id, obraId });
      showSuccess(`Lançamento excluído.`);
    } catch (err) {
      showError(`Erro ao excluir.`);
    }
  };

  const handleDateSelect = (range: { from: Date | undefined, to: Date | undefined } | undefined) => {
    const newRange = range || { from: undefined, to: undefined };
    setDateRange(newRange);
    setFilters(prev => ({
      ...prev,
      startDate: newRange.from ? format(newRange.from, 'yyyy-MM-dd') : undefined,
      endDate: newRange.to ? format(newRange.to, 'yyyy-MM-dd') : undefined
    }));
  };

  const handleCategoryChange = (val: string) => {
    setSelectedCategory(val === "all" ? undefined : val);
    setFilters(prev => ({ ...prev, categoryId: val === "all" ? undefined : val }));
  };

  const filteredEntries = useMemo(() => {
    if (!entries) return [];
    if (!searchText) return entries;
    const lowerSearch = searchText.toLowerCase();
    return entries.filter(entry =>
      entry.descricao.toLowerCase().includes(lowerSearch) ||
      entry.categorias_despesa?.nome.toLowerCase().includes(lowerSearch) ||
      entry.valor.toString().includes(searchText)
    );
  }, [entries, searchText]);

  if (isLoading) return <div className="flex justify-center items-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  const isAllSelected = filteredEntries.length > 0 && selectedEntryIds.length === filteredEntries.length;

  return (
    <div className="space-y-4">
      {/* Filtros Responsivos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-wrap gap-3 items-center p-4 border rounded-xl bg-card shadow-sm">
        <div className="relative w-full lg:w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar..." value={searchText} onChange={(e) => setSearchText(e.target.value)} className="pl-9 bg-background" />
          {searchText && <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" onClick={() => setSearchText('')}><X className="h-4 w-4" /></Button>}
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full lg:w-[260px] justify-start text-left font-normal bg-background">
              <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
              <span className="truncate">
                {dateRange.from ? (
                  dateRange.to ? (
                    `${format(dateRange.from, "dd/MM/yy")} - ${format(dateRange.to, "dd/MM/yy")}`
                  ) : (
                    format(dateRange.from, "dd/MM/yy")
                  )
                ) : (
                  "Filtrar Período"
                )}
              </span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="range"
              selected={dateRange}
              onSelect={handleDateSelect}
              numberOfMonths={isMobile ? 1 : 2}
              locale={ptBR}
            />
          </PopoverContent>
        </Popover>

        <Select value={selectedCategory || "all"} onValueChange={handleCategoryChange}>
          <SelectTrigger className="w-full lg:w-[180px] bg-background">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas Categorias</SelectItem>
            {categories?.map(cat => <SelectItem key={cat.id} value={cat.id}>{cat.nome}</SelectItem>)}
          </SelectContent>
        </Select>

        <div className="flex gap-2 w-full lg:w-auto lg:ml-auto">
          {selectedEntryIds.length > 0 && (
            <>
              <BulkCategoryUpdateDialog
                selectedEntryIds={selectedEntryIds}
                obraId={obraId}
                onSuccess={handleBulkUpdateSuccess}
              />
              <BulkUpdateDialog
                selectedEntryIds={selectedEntryIds}
                onSuccess={handleBulkUpdateSuccess}
              />
            </>
          )}
        </div>
      </div>

      {/* Visualização Mobile: Cards */}
      {isMobile ? (
        <div className="space-y-3">
            <div className="flex items-center justify-between px-2 mb-2">
                <div className="flex items-center gap-2">
                    <Checkbox checked={isAllSelected} onCheckedChange={handleSelectAll} id="select-all-mobile" />
                    <label htmlFor="select-all-mobile" className="text-sm font-medium text-muted-foreground">Selecionar Todos</label>
                </div>
                <span className="text-xs text-muted-foreground">{filteredEntries.length} lançamentos</span>
            </div>
            {filteredEntries.map((entry) => (
                <Card key={entry.id} className={cn("relative overflow-hidden border-l-4", entry.ignorar_soma ? "border-l-muted opacity-80" : "border-l-destructive", selectedEntryIds.includes(entry.id) && "ring-1 ring-primary bg-primary/5")}>
                    <CardContent className="p-4">
                        <div className="flex justify-between items-start gap-2">
                            <div className="flex items-start gap-3">
                                <Checkbox checked={selectedEntryIds.includes(entry.id)} onCheckedChange={(c) => handleSelectEntry(entry.id, !!c)} className="mt-1" />
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold text-muted-foreground">{formatDate(entry.data_gasto)}</span>
                                        <Badge variant="outline" className="text-[10px] py-0">{entry.categorias_despesa?.nome}</Badge>
                                    </div>
                                    <p className="font-semibold text-sm leading-snug line-clamp-2">{entry.descricao}</p>
                                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                                        <span className="flex items-center"><ReceiptText className="w-3 h-3 mr-1" /> {entry.forma_pagamento}</span>
                                        {entry.ignorar_soma && <span className="text-amber-600 font-bold">• Ignorado no saldo</span>}
                                    </div>
                                </div>
                            </div>
                            <div className="text-right flex flex-col items-end gap-2">
                                <span className="font-bold text-destructive text-lg">{formatCurrency(entry.valor)}</span>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <EntryDialog obraId={obraId} initialData={entry} trigger={<DropdownMenuItem onSelect={(e) => e.preventDefault()}>Editar</DropdownMenuItem>} />
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive">Excluir</DropdownMenuItem>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent className="w-[90vw] max-w-sm rounded-xl">
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Excluir Lançamento?</AlertDialogTitle>
                                                    <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter className="flex-col gap-2">
                                                    <AlertDialogCancel className="w-full">Voltar</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleDelete(entry.id)} className="bg-destructive w-full">Confirmar Exclusão</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
      ) : (
        /* Visualização Desktop: Tabela */
        <div className="rounded-xl border overflow-hidden bg-card shadow-sm">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-[40px] text-center"><Checkbox checked={isAllSelected} onCheckedChange={handleSelectAll} /></TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEntries.map((entry) => (
                <TableRow key={entry.id} className={cn(selectedEntryIds.includes(entry.id) && "bg-primary/5", entry.ignorar_soma && "opacity-60")}>
                  <TableCell className="text-center"><Checkbox checked={selectedEntryIds.includes(entry.id)} onCheckedChange={(c) => handleSelectEntry(entry.id, !!c)} /></TableCell>
                  <TableCell>{formatDate(entry.data_gasto)}</TableCell>
                  <TableCell><Badge variant="outline">{entry.categorias_despesa?.nome}</Badge></TableCell>
                  <TableCell className="max-w-xs truncate" title={entry.descricao}>{entry.descricao}</TableCell>
                  <TableCell className="text-right font-bold text-destructive">
                    {formatCurrency(entry.valor)}
                  </TableCell>
                  <TableCell className="text-right space-x-1">
                    <EntryDialog obraId={obraId} initialData={entry} trigger={<Button variant="ghost" size="icon" title="Editar"><Edit className="w-4 h-4" /></Button>} />
                    <AlertDialog>
                      <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="text-destructive" title="Excluir"><Trash2 className="w-4 h-4" /></Button></AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader><AlertDialogTitle>Excluir Lançamento?</AlertDialogTitle><AlertDialogDescription>Deseja realmente remover "{entry.descricao}"?</AlertDialogDescription></AlertDialogHeader>
                        <AlertDialogFooter><AlertDialogCancel>Não</AlertDialogCancel><AlertDialogAction onClick={() => handleDelete(entry.id)} className="bg-destructive">Sim, Excluir</AlertDialogAction></AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
              {filteredEntries.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">Nenhum lançamento encontrado com os filtros atuais.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default EntriesTable;