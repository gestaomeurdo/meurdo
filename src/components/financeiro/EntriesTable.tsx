import { useState } from "react";
import { FinancialEntry, useDeleteFinancialEntry, PaymentMethod } from "@/hooks/use-financial-entries";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Download, Loader2, Filter, CalendarIcon, Tag, MoreVertical } from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import EntryDialog from "./EntryDialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useExpenseCategories } from "@/hooks/use-expense-categories";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { formatCurrency, formatDate } from "@/utils/formatters";
import { Checkbox } from "@/components/ui/checkbox";
import BulkCategoryUpdateDialog from "./BulkCategoryUpdateDialog";
import BulkUpdateDialog from "./BulkUpdateDialog"; // Importando o novo componente
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface EntriesTableProps {
  entries: FinancialEntry[] | undefined;
  obraId: string;
  isLoading: boolean;
  refetch: () => void;
  setFilters: (filters: any) => void;
}

const paymentMethods: PaymentMethod[] = ['Pix', 'Dinheiro', 'Cartão', 'Boleto', 'Transferência'];

const EntriesTable = ({ entries, obraId, isLoading, refetch, setFilters }: EntriesTableProps) => {
  const deleteMutation = useDeleteFinancialEntry();
  const { data: categories } = useExpenseCategories();
  
  const [dateRange, setDateRange] = useState<{ from: Date | undefined, to: Date | undefined }>({ from: undefined, to: undefined });
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | undefined>(undefined);
  const [selectedEntryIds, setSelectedEntryIds] = useState<string[]>([]);

  const handleSelectEntry = (id: string, checked: boolean) => {
    setSelectedEntryIds(prev => 
      checked ? [...prev, id] : prev.filter(entryId => entryId !== id)
    );
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked && entries) {
      setSelectedEntryIds(entries.map(entry => entry.id));
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

  const getLancerName = (entry: FinancialEntry) => {
    if (entry.profiles?.first_name || entry.profiles?.last_name) {
      return `${entry.profiles.first_name || ''} ${entry.profiles.last_name || ''}`.trim();
    }
    return entry.profiles?.email || 'N/A';
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Carregando lançamentos...</span>
      </div>
    );
  }

  if (!entries || entries.length === 0) {
    return (
      <div className="text-center py-12 border border-dashed rounded-lg bg-muted/50">
        <Filter className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">Nenhum lançamento encontrado</h2>
        <p className="text-muted-foreground mb-4">
          {entries === undefined ? "Selecione uma obra para ver os lançamentos." : "Comece adicionando um novo lançamento financeiro."}
        </p>
      </div>
    );
  }
  
  const isAllSelected = entries.length > 0 && selectedEntryIds.length === entries.length;
  const isIndeterminate = selectedEntryIds.length > 0 && selectedEntryIds.length < entries.length;

  return (
    <div className="space-y-4">
      {/* Filters and Bulk Actions */}
      <div className="flex flex-wrap gap-4 items-center p-4 border rounded-lg bg-card">
        <span className="font-medium text-sm text-muted-foreground">Filtros:</span>
        
        {/* Date Range Filter */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              id="date"
              variant={"outline"}
              className="w-full md:w-[240px] justify-start text-left font-normal"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateRange?.from ? (
                dateRange.to ? (
                  <>
                    {format(dateRange.from, "LLL dd, y")} -{" "}
                    {format(dateRange.to, "LLL dd, y")}
                  </>
                ) : (
                  format(dateRange.from, "LLL dd, y")
                )
              ) : (
                <span>Filtrar por Período</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={dateRange?.from}
              selected={dateRange}
              onSelect={handleDateSelect}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>

        {/* Category Filter */}
        <Select value={selectedCategory || "all"} onValueChange={handleCategoryChange}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Filtrar por Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as Categorias</SelectItem>
            {categories?.map(cat => (
              <SelectItem key={cat.id} value={cat.id}>{cat.nome}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Payment Method Filter */}
        <Select value={selectedPaymentMethod || "all"} onValueChange={handlePaymentMethodChange}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Filtrar por Pagamento" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as Formas</SelectItem>
            {paymentMethods.map(method => (
              <SelectItem key={method} value={method}>{method}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {/* Bulk Action Buttons */}
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

      {/* Table */}
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px] text-center">
                <Checkbox
                  checked={isAllSelected}
                  onCheckedChange={handleSelectAll}
                  aria-label="Selecionar todos"
                  className="translate-y-[2px]"
                  // @ts-ignore - Radix Checkbox supports indeterminate state
                  indeterminate={isIndeterminate}
                />
              </TableHead>
              <TableHead className="w-[100px]">Data</TableHead>
              <TableHead className="w-[150px]">Categoria</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead className="text-right w-[150px]">Valor</TableHead>
              <TableHead className="w-[120px]">Pagamento</TableHead>
              <TableHead className="w-[150px]">Lançado por</TableHead>
              <TableHead className="w-[100px]">Documento</TableHead>
              <TableHead className="text-right w-[100px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.map((entry) => {
              const isSelected = selectedEntryIds.includes(entry.id);
              return (
                <TableRow key={entry.id} className={isSelected ? "bg-primary/5 hover:bg-primary/10" : ""}>
                  <TableCell className="text-center">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={(checked) => handleSelectEntry(entry.id, !!checked)}
                      aria-label={`Selecionar lançamento ${entry.descricao}`}
                    />
                  </TableCell>
                  <TableCell>{formatDate(entry.data_gasto)}</TableCell>
                  <TableCell className="font-medium">{entry.categorias_despesa?.nome || 'N/A'}</TableCell>
                  <TableCell className="max-w-xs truncate">{entry.descricao}</TableCell>
                  <TableCell className="text-right font-semibold text-destructive">
                    {formatCurrency(entry.valor)}
                  </TableCell>
                  <TableCell>{entry.forma_pagamento}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {getLancerName(entry)}
                  </TableCell>
                  <TableCell>
                    {entry.documento_url ? (
                      <a href={entry.documento_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center text-sm">
                        <Download className="w-4 h-4 mr-1" />
                        Ver
                      </a>
                    ) : (
                      <span className="text-muted-foreground text-sm">N/A</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <EntryDialog 
                      obraId={obraId}
                      initialData={entry}
                      trigger={
                        <Button variant="ghost" size="icon" title="Editar">
                          <Edit className="w-4 h-4" />
                        </Button>
                      }
                    />
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" title="Excluir">
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja excluir o lançamento: <span className="font-bold">"{entry.descricao}"</span> no valor de {formatCurrency(entry.valor)}? Esta ação é irreversível.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => handleDelete(entry.id, entry.descricao)}
                            disabled={deleteMutation.isPending}
                            className="bg-destructive hover:bg-destructive/90"
                          >
                            {deleteMutation.isPending ? "Excluindo..." : "Excluir"}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default EntriesTable;