import { useState, useMemo } from "react";
import { FinancialEntry, useDeleteFinancialEntry, PaymentMethod, FinancialEntriesResult } from "@/hooks/use-financial-entries";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Loader2, CalendarIcon, Search, X, FileDown } from "lucide-react";
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
import BulkUpdateDialog from "./BulkUpdateDialog";
import { Input } from "@/components/ui/input";
import { useExportFinancialCsv } from "@/hooks/use-export-financial-csv";
import { Badge } from "@/components/ui/badge";

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
  const { exportCsv, isExporting } = useExportFinancialCsv();
  
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

  const handleDelete = async (id: string, descricao: string) => {
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

  const handleExport = () => {
    exportCsv({ obraId, ...currentFilters });
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

  const totalAtivo = filteredEntries.filter(e => !e.ignorar_soma).reduce((sum, e) => sum + e.valor, 0);

  if (isLoading) return <div className="flex justify-center items-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  const isAllSelected = filteredEntries.length > 0 && selectedEntryIds.length === filteredEntries.length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4 items-center p-4 border rounded-lg bg-card">
        <div className="relative w-full md:w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar..." value={searchText} onChange={(e) => setSearchText(e.target.value)} className="pl-9" />
          {searchText && <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" onClick={() => setSearchText('')}><X className="h-4 w-4" /></Button>}
        </div>
        <Popover>
          <PopoverTrigger asChild><Button variant="outline" className="w-full md:w-[240px] justify-start"><CalendarIcon className="mr-2 h-4 w-4" />Período</Button></PopoverTrigger>
          <PopoverContent className="w-auto p-0"><Calendar mode="range" selected={dateRange} onSelect={handleDateSelect} numberOfMonths={2} /></PopoverContent>
        </Popover>
        <Select value={selectedCategory || "all"} onValueChange={handleCategoryChange}>
          <SelectTrigger className="w-full md:w-[180px]"><SelectValue placeholder="Categoria" /></SelectTrigger>
          <SelectContent><SelectItem value="all">Todas</SelectItem>{categories?.map(cat => <SelectItem key={cat.id} value={cat.id}>{cat.nome}</SelectItem>)}</SelectContent>
        </Select>
        <div className="flex gap-2 ml-auto">
          {selectedEntryIds.length > 0 && <BulkUpdateDialog selectedEntryIds={selectedEntryIds} onSuccess={handleBulkUpdateSuccess} />}
          <Button variant="outline" size="sm" onClick={handleExport} disabled={isExporting}><FileDown className="w-4 h-4 mr-2" /> Exportar</Button>
        </div>
      </div>
      
      <div className="flex justify-between items-center p-4 bg-primary/5 border border-primary/20 rounded-lg">
        <h3 className="text-lg font-bold">Saldo Ativo (Lista): <span className="text-primary">{formatCurrency(totalAtivo)}</span></h3>
        <span className="text-sm text-muted-foreground">{filteredEntries.length} itens</span>
      </div>

      <div className="rounded-md border overflow-x-auto bg-card">
        <Table>
          <TableHeader>
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
              <TableRow key={entry.id} className={cn(selectedEntryIds.includes(entry.id) && "bg-primary/5")}>
                <TableCell className="text-center"><Checkbox checked={selectedEntryIds.includes(entry.id)} onCheckedChange={(c) => handleSelectEntry(entry.id, !!c)} /></TableCell>
                <TableCell>{formatDate(entry.data_gasto)}</TableCell>
                <TableCell><Badge variant="outline">{entry.categorias_despesa?.nome}</Badge></TableCell>
                <TableCell className="max-w-xs truncate">{entry.descricao}</TableCell>
                <TableCell className="text-right font-bold text-destructive">
                  {formatCurrency(entry.valor)}
                </TableCell>
                <TableCell className="text-right space-x-1">
                  <EntryDialog obraId={obraId} initialData={entry} trigger={<Button variant="ghost" size="icon"><Edit className="w-4 h-4" /></Button>} />
                  <AlertDialog>
                    <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="text-destructive"><Trash2 className="w-4 h-4" /></Button></AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader><AlertDialogTitle>Excluir?</AlertDialogTitle></AlertDialogHeader>
                      <AlertDialogFooter><AlertDialogCancel>Não</AlertDialogCancel><AlertDialogAction onClick={() => handleDelete(entry.id, entry.descricao)} className="bg-destructive">Sim</AlertDialogAction></AlertDialogFooter>
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