import { useState, useMemo } from "react";
import { FinancialEntry, useDeleteFinancialEntry, PaymentMethod, FinancialEntriesResult } from "@/hooks/use-financial-entries";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Download, Loader2, Filter, CalendarIcon, Tag, Search, X, FileDown } from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import EntryDialog from "./EntryDialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useExpenseCategories } from "@/hooks/use-expense-categories";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { formatCurrency, formatDate } from "@/utils/formatters";
import { Checkbox } from "@/components/ui/checkbox";
import BulkCategoryUpdateDialog from "./BulkCategoryUpdateDialog";
import BulkUpdateDialog from "./BulkUpdateDialog";
import { Input } from "@/components/ui/input";
import { useExportFinancialCsv } from "@/hooks/use-export-financial-csv";

interface EntriesTableProps {
  entriesResult: FinancialEntriesResult | undefined;
  obraId: string;
  isLoading: boolean;
  refetch: () => void;
  setFilters: (filters: any) => void;
  currentFilters: any;
}

const paymentMethods: PaymentMethod[] = ['Pix', 'Dinheiro', 'Cartão', 'Boleto', 'Transferência'];

const EntriesTable = ({ entriesResult, obraId, isLoading, refetch, setFilters, currentFilters }: EntriesTableProps) => {
  const entries = entriesResult?.entries;
  const deleteMutation = useDeleteFinancialEntry();
  const { data: categories } = useExpenseCategories();
  const { exportCsv, isExporting } = useExportFinancialCsv();
  
  const [dateRange, setDateRange] = useState<{ from: Date | undefined, to: Date | undefined }>({ from: currentFilters.startDate ? new Date(currentFilters.startDate) : undefined, to: currentFilters.endDate ? new Date(currentFilters.endDate) : undefined });
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(currentFilters.categoryId);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | undefined>(currentFilters.paymentMethod);
  const [searchText, setSearchText] = useState<string>('');
  const [selectedEntryIds, setSelectedEntryIds] = useState<string[]>([]);
  const [showIdColumn, setShowIdColumn] = useState(false);

  const handleSelectEntry = (id: string, checked: boolean) => {
    setSelectedEntryIds(prev => 
      checked ? [...prev, id] : prev.filter(entryId => entryId !== id)
    );
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

  const handleDelete = async (id: string, descricao: string) => {
    try {
      await deleteMutation.mutateAsync({ id, obraId });
      showSuccess(`Lançamento "${descricao}" excluído com sucesso.`);
    } catch (err) {
      showError(`Erro ao excluir lançamento: ${err instanceof Error ? err.message : "Erro desconhecido"}`);
    }
  };
  
  const handleBulkDelete = async () => {
    if (selectedEntryIds.length === 0) return;
    try {
      const deletePromises = selectedEntryIds.map(id => 
        deleteMutation.mutateAsync({ id, obraId })
      );
      await Promise.all(deletePromises);
      showSuccess(`${selectedEntryIds.length} lançamentos excluídos com sucesso.`);
      setSelectedEntryIds([]);
      refetch();
    } catch (err) {
      showError(`Erro ao excluir em massa.`);
    }
  };

  const handleFilterChange = (newFilters: any) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handleDateSelect = (range: { from: Date | undefined, to: Date | undefined } | undefined) => {
    setDateRange(range || { from: undefined, to: undefined });
    handleFilterChange({
      startDate: range?.from ? format(range.from, 'yyyy-MM-dd') : undefined,
      endDate: range?.to ? format(range.to, 'yyyy-MM-dd') : undefined,
    });
  };

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId === "all" ? undefined : categoryId);
    handleFilterChange({ categoryId: categoryId === "all" ? undefined : categoryId });
  };

  const handlePaymentMethodChange = (method: PaymentMethod | 'all') => {
    setSelectedPaymentMethod(method === "all" ? undefined : method);
    handleFilterChange({ paymentMethod: method === "all" ? undefined : method });
  };
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(e.target.value);
  };

  const handleExport = () => {
    exportCsv({
      obraId,
      startDate: currentFilters.startDate,
      endDate: currentFilters.endDate,
      categoryId: currentFilters.categoryId,
      paymentMethod: currentFilters.paymentMethod,
    });
  };

  const getLancerName = (entry: FinancialEntry) => {
    const firstName = entry.profiles?.first_name;
    const lastName = entry.profiles?.last_name;
    if (firstName || lastName) return `${firstName || ''} ${lastName || ''}`.trim();
    if (entry.profiles?.email) return entry.profiles.email.split('@')[0];
    return 'N/A';
  };
  
  const filteredEntries = useMemo(() => {
    if (!entries) return [];
    if (!searchText) return entries;
    const lowerSearch = searchText.toLowerCase();
    return entries.filter(entry => 
      entry.descricao.toLowerCase().includes(lowerSearch) ||
      entry.categorias_despesa?.nome.toLowerCase().includes(lowerSearch) ||
      entry.forma_pagamento.toLowerCase().includes(lowerSearch) ||
      entry.valor.toString().includes(searchText)
    );
  }, [entries, searchText]);

  const totalFilteredValue = useMemo(() => {
    return filteredEntries.reduce((sum, entry) => sum + entry.valor, 0);
  }, [filteredEntries]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Carregando lançamentos...</span>
      </div>
    );
  }

  const isAllSelected = filteredEntries.length > 0 && selectedEntryIds.length === filteredEntries.length;
  const isIndeterminate = selectedEntryIds.length > 0 && selectedEntryIds.length < filteredEntries.length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4 items-center p-4 border rounded-lg bg-card">
        <div className="relative w-full md:w-[240px]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar (descrição ou valor)..." value={searchText} onChange={handleSearchChange} className="pl-9" />
          {searchText && (
            <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7" onClick={() => setSearchText('')}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        <Popover>
          <PopoverTrigger asChild>
            <Button variant={"outline"} className="w-full md:w-[240px] justify-start text-left font-normal">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateRange?.from ? (dateRange.to ? <>{format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}</> : format(dateRange.from, "LLL dd, y")) : <span>Filtrar por Período</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start"><Calendar initialFocus mode="range" defaultMonth={dateRange?.from} selected={dateRange} onSelect={handleDateSelect} numberOfMonths={2} /></PopoverContent>
        </Popover>

        <Select value={selectedCategory || "all"} onValueChange={handleCategoryChange}>
          <SelectTrigger className="w-full md:w-[180px]"><SelectValue placeholder="Categoria" /></SelectTrigger>
          <SelectContent><SelectItem value="all">Todas</SelectItem>{categories?.map(cat => <SelectItem key={cat.id} value={cat.id}>{cat.nome}</SelectItem>)}</SelectContent>
        </Select>

        <div className="flex gap-2 ml-auto">
          {selectedEntryIds.length > 0 && (
            <div className="flex gap-2 animate-in fade-in slide-in-from-right-4">
              <BulkUpdateDialog selectedEntryIds={selectedEntryIds} onSuccess={handleBulkUpdateSuccess} />
              <AlertDialog>
                <AlertDialogTrigger asChild><Button variant="destructive" size="sm"><Trash2 className="w-4 h-4 mr-2" /> Apagar ({selectedEntryIds.length})</Button></AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader><AlertDialogTitle>Apagar em Massa</AlertDialogTitle><AlertDialogDescription>Deseja excluir {selectedEntryIds.length} lançamentos?</AlertDialogDescription></AlertDialogHeader>
                  <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={handleBulkDelete} className="bg-destructive">Excluir Tudo</AlertDialogAction></AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
          <Button variant="outline" size="sm" onClick={handleExport} disabled={isExporting || filteredEntries.length === 0}>
            {isExporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileDown className="w-4 h-4 mr-2" />} Exportar CSV
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setShowIdColumn(!showIdColumn)} title="Mostrar IDs"><Search className="w-4 h-4" /></Button>
        </div>
      </div>
      
      <div className="flex justify-between items-center p-4 bg-primary/5 border border-primary/20 rounded-lg">
        <h3 className="text-lg font-bold">Total Gasto (Filtrado): <span className="text-primary">{formatCurrency(totalFilteredValue)}</span></h3>
        <span className="text-sm font-medium text-muted-foreground">{filteredEntries.length} lançamentos encontrados</span>
      </div>

      <div className="rounded-md border overflow-x-auto bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px] text-center"><Checkbox checked={isAllSelected} onCheckedChange={handleSelectAll} /></TableHead>
              {showIdColumn && <TableHead className="w-[100px]">ID</TableHead>}
              <TableHead>Data</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead>Pagamento</TableHead>
              <TableHead>Lançado por</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredEntries.map((entry) => (
              <TableRow key={entry.id} className={selectedEntryIds.includes(entry.id) ? "bg-primary/5" : ""}>
                <TableCell className="text-center"><Checkbox checked={selectedEntryIds.includes(entry.id)} onCheckedChange={(checked) => handleSelectEntry(entry.id, !!checked)} /></TableCell>
                {showIdColumn && <TableCell className="text-xs text-muted-foreground font-mono">{entry.id.slice(0, 8)}</TableCell>}
                <TableCell>{formatDate(entry.data_gasto)}</TableCell>
                <TableCell><Badge variant="outline">{entry.categorias_despesa?.nome || 'N/A'}</Badge></TableCell>
                <TableCell className="max-w-xs truncate" title={entry.descricao}>{entry.descricao}</TableCell>
                <TableCell className="text-right font-bold text-destructive">{formatCurrency(entry.valor)}</TableCell>
                <TableCell className="text-xs">{entry.forma_pagamento}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{getLancerName(entry)}</TableCell>
                <TableCell className="text-right space-x-1">
                  <EntryDialog obraId={obraId} initialData={entry} trigger={<Button variant="ghost" size="icon"><Edit className="w-4 h-4" /></Button>} />
                  <AlertDialog>
                    <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="text-destructive"><Trash2 className="w-4 h-4" /></Button></AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader><AlertDialogTitle>Excluir Lançamento</AlertDialogTitle><AlertDialogDescription>Deseja excluir "{entry.descricao}"?</AlertDialogDescription></AlertDialogHeader>
                      <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => handleDelete(entry.id, entry.descricao)} className="bg-destructive">Excluir</AlertDialogAction></AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default EntriesTable;