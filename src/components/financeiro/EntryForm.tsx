import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { showSuccess, showError } from "@/utils/toast";
import { CalendarIcon, Upload, Loader2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { useExpenseCategories, ExpenseCategory } from "@/hooks/use-expense-categories";
import { FinancialEntry, PaymentMethod, useCreateFinancialEntry, useUpdateFinancialEntry } from "@/hooks/use-financial-entries";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";

const paymentMethods: PaymentMethod[] = ['Pix', 'Dinheiro', 'Cartão', 'Boleto', 'Transferência'];

// Utility functions for currency handling (copied from ObraForm)
const parseCurrencyInput = (value: string): number => {
  if (!value) return 0;
  const cleanedValue = value.replace(/\./g, '').replace(',', '.');
  return parseFloat(cleanedValue) || 0;
};

const formatCurrencyForInput = (value: number | undefined): string => {
  if (value === undefined || value === null) return "";
  return new Intl.NumberFormat('pt-BR', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  }).format(value);
};

const EntrySchema = z.object({
  obra_id: z.string().uuid("Obra inválida."),
  data_gasto: z.date({ required_error: "Data do gasto é obrigatória." }),
  categoria_id: z.string().uuid("Selecione uma categoria."),
  descricao: z.string().min(5, "Descrição detalhada é obrigatória."),
  valor: z.string().min(1, "O valor é obrigatório."),
  forma_pagamento: z.enum(paymentMethods),
  documento_file: z.any().optional(), // For file upload
  documento_url: z.string().optional().nullable(), // Existing URL
}).refine((data) => {
    const parsedValue = parseCurrencyInput(data.valor);
    return parsedValue > 0;
}, {
    message: "O valor deve ser maior que zero.",
    path: ["valor"],
});

type EntryFormValues = z.infer<typeof EntrySchema>;

interface EntryFormProps {
  obraId: string;
  initialData?: FinancialEntry;
  onSuccess: () => void;
}

const EntryForm = ({ obraId, initialData, onSuccess }: EntryFormProps) => {
  const isEditing = !!initialData;
  const createMutation = useCreateFinancialEntry();
  const updateMutation = useUpdateFinancialEntry();
  const { data: categories, isLoading: isLoadingCategories } = useExpenseCategories();
  const [isUploading, setIsUploading] = useState(false);
  const [documentPreview, setDocumentPreview] = useState<string | null>(initialData?.documento_url || null);

  const form = useForm<EntryFormValues>({
    resolver: zodResolver(EntrySchema),
    defaultValues: {
      obra_id: obraId,
      data_gasto: initialData?.data_gasto ? new Date(initialData.data_gasto) : new Date(),
      categoria_id: initialData?.categoria_id || "",
      descricao: initialData?.descricao || "",
      valor: initialData?.valor !== undefined 
        ? formatCurrencyForInput(initialData.valor) 
        : "",
      forma_pagamento: initialData?.forma_pagamento || 'Pix',
      documento_url: initialData?.documento_url || null,
    },
  });

  const handleFileUpload = async (file: File): Promise<string | null> => {
    if (!file) return null;

    setIsUploading(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `lancamentos/${obraId}/${fileName}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from('documentos_financeiros')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data: publicUrlData } = supabase.storage
        .from('documentos_financeiros')
        .getPublicUrl(filePath);

      setDocumentPreview(publicUrlData.publicUrl);
      return publicUrlData.publicUrl;
    } catch (error) {
      showError("Erro ao fazer upload do documento.");
      console.error("Upload error:", error);
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const onSubmit = async (values: EntryFormValues) => {
    const parsedValor = parseCurrencyInput(values.valor);
    let documentoUrl = values.documento_url || null;

    try {
      // Handle file upload if a new file is selected
      if (values.documento_file && values.documento_file.length > 0) {
        const file = values.documento_file[0];
        documentoUrl = await handleFileUpload(file);
        if (!documentoUrl && file) {
          // If upload failed, stop submission
          return;
        }
      }

      const dataToSubmit = {
        obra_id: values.obra_id,
        data_gasto: format(values.data_gasto, 'yyyy-MM-dd'),
        categoria_id: values.categoria_id,
        descricao: values.descricao,
        valor: parsedValor,
        forma_pagamento: values.forma_pagamento,
        documento_url: documentoUrl,
      };

      if (isEditing && initialData) {
        await updateMutation.mutateAsync({ ...dataToSubmit, id: initialData.id });
        showSuccess("Lançamento atualizado com sucesso!");
      } else {
        await createMutation.mutateAsync(dataToSubmit);
        showSuccess("Lançamento criado com sucesso!");
      }
      onSuccess();
    } catch (error) {
      showError(`Erro ao salvar lançamento: ${error instanceof Error ? error.message : "Erro desconhecido"}`);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending || isUploading;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="data_gasto"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel className="mb-1">Data do Gasto</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                      disabled={isLoading}
                    >
                      {field.value ? format(field.value, "dd/MM/yyyy") : <span>Selecione a data</span>}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="categoria_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Categoria</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading || isLoadingCategories}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a categoria" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {categories?.map((category: ExpenseCategory) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="descricao"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição Detalhada</FormLabel>
              <FormControl>
                <Textarea placeholder="Ex: Compra de 50 sacos de cimento Votoran na loja X" {...field} disabled={isLoading} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="valor"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Valor (R$)</FormLabel>
                <FormControl>
                  <Input 
                    type="text" 
                    placeholder="0,00" 
                    {...field} 
                    disabled={isLoading} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="forma_pagamento"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Forma de Pagamento</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a forma" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {paymentMethods.map(method => (
                      <SelectItem key={method} value={method}>
                        {method}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="documento_file"
          render={({ field: { value, onChange, ...fieldProps } }) => (
            <FormItem>
              <FormLabel>Nota Fiscal / Foto</FormLabel>
              <FormControl>
                <Input
                  {...fieldProps}
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(event) => {
                    onChange(event.target.files);
                    // Clear existing URL if a new file is selected
                    form.setValue('documento_url', null);
                    setDocumentPreview(null);
                  }}
                  disabled={isLoading}
                  className="hidden"
                  id="documento-upload"
                />
              </FormControl>
              <div className="flex items-center space-x-4">
                <label htmlFor="documento-upload" className={cn(
                  "flex items-center justify-center p-2 border rounded-md cursor-pointer transition-colors",
                  isLoading ? "bg-muted cursor-not-allowed" : "hover:bg-accent"
                )}>
                  <Upload className="w-4 h-4 mr-2" />
                  {isUploading ? "Enviando..." : (documentPreview ? "Mudar Documento" : "Selecionar Arquivo")}
                </label>
                {documentPreview && (
                  <a 
                    href={documentPreview} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-sm text-primary hover:underline truncate max-w-[200px]"
                  >
                    {documentPreview.split('/').pop()}
                  </a>
                )}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isLoading}>
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {isEditing ? "Salvar Alterações" : "Salvar Lançamento"}
        </Button>
      </form>
    </Form>
  );
};

export default EntryForm;