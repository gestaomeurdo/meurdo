import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { showSuccess, showError } from "@/utils/toast";
import { CalendarIcon, Loader2, Save, Upload, X, Package, Truck, Receipt, CheckCircle } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { useCreateReceipt, useUpdateReceipt, MaterialReceipt } from "@/hooks/use-material-receipts";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { compressImage } from "@/utils/image-compression";

const ReceiptSchema = z.object({
  obra_id: z.string().uuid(),
  data_recebimento: z.date({ required_error: "Data é obrigatória" }),
  material: z.string().min(2, "Material é obrigatório"),
  quantidade: z.coerce.number().min(0.01, "Quantidade inválida"),
  unidade: z.string().min(1, "Unidade é obrigatória"),
  fornecedor: z.string().optional().nullable(),
  numero_nf: z.string().optional().nullable(),
  status: z.enum(['Conforme', 'Com Avaria']),
  observacoes: z.string().optional().nullable(),
  foto_url: z.string().optional().nullable(),
});

type ReceiptFormValues = z.infer<typeof ReceiptSchema>;

interface ReceiptFormProps {
  obraId: string;
  initialData?: MaterialReceipt;
  onSuccess: () => void;
}

const ReceiptForm = ({ obraId, initialData, onSuccess }: ReceiptFormProps) => {
  const isEditing = !!initialData;
  const createMutation = useCreateReceipt();
  const updateMutation = useUpdateReceipt();
  const [isUploading, setIsUploading] = useState(false);

  const form = useForm<ReceiptFormValues>({
    resolver: zodResolver(ReceiptSchema),
    defaultValues: {
      obra_id: obraId,
      data_recebimento: initialData?.data_recebimento ? new Date(initialData.data_recebimento + 'T12:00:00') : new Date(),
      status: initialData?.status || 'Conforme',
      unidade: initialData?.unidade || 'un',
      material: initialData?.material || '',
      quantidade: initialData?.quantidade || 0,
      fornecedor: initialData?.fornecedor || '',
      numero_nf: initialData?.numero_nf || '',
      foto_url: initialData?.foto_url || null,
      observacoes: initialData?.observacoes || '',
    },
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    
    try {
      const compressedFile = await compressImage(file);
      const fileExt = compressedFile.name.split('.').pop();
      const fileName = `material-${Date.now()}.${fileExt}`;
      const filePath = `materiais/${obraId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('documentos_financeiros')
        .upload(filePath, compressedFile);

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('documentos_financeiros')
        .getPublicUrl(filePath);

      form.setValue('foto_url', publicUrlData.publicUrl);
      showSuccess("Foto anexada!");
    } catch (error) {
      showError("Erro no upload da foto.");
    } finally {
      setIsUploading(false);
    }
  };

  const onSubmit = async (values: ReceiptFormValues) => {
    try {
      const payload = {
        ...values,
        data_recebimento: format(values.data_recebimento, 'yyyy-MM-dd'),
      };

      if (isEditing && initialData) {
        await updateMutation.mutateAsync({ ...payload, id: initialData.id });
        showSuccess("Material atualizado!");
      } else {
        await createMutation.mutateAsync(payload);
        showSuccess("Recebimento registrado!");
      }
      onSuccess();
    } catch (error) {
      showError("Erro ao salvar recebimento.");
    }
  };

  const currentFoto = form.watch('foto_url');
  const isLoading = createMutation.isPending || updateMutation.isPending || isUploading;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="data_recebimento"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Data do Recebimento</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                      >
                        {field.value ? format(field.value, "dd/MM/yyyy") : "Selecionar"}
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
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Condição de Entrega</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Conforme">Conforme (Tudo OK)</SelectItem>
                    <SelectItem value="Com Avaria">Com Avaria (Danos)</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="material"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Material / Insumo</FormLabel>
              <FormControl>
                <div className="relative">
                  <Package className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    className="pl-9"
                    placeholder="Ex: Cimento CP V 50kg"
                    {...field}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="quantidade"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Quantidade</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="unidade"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Unidade</FormLabel>
                <FormControl>
                  <Input placeholder="Saco, m3, un" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="fornecedor"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fornecedor</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Truck className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      className="pl-9"
                      placeholder="Nome da empresa"
                      {...field}
                      value={field.value || ""}
                    />
                  </div>
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="numero_nf"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Número da Nota Fiscal</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Receipt className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      className="pl-9"
                      placeholder="Opcional"
                      {...field}
                      value={field.value || ""}
                    />
                  </div>
                </FormControl>
              </FormItem>
            )}
          />
        </div>
        <div className="space-y-3">
          <FormLabel>Foto do Material ou NF</FormLabel>
          <div className="flex items-center gap-4">
            {currentFoto ? (
              <div className="relative w-24 h-24 rounded-lg overflow-hidden border">
                <img src={currentFoto} alt="Preview" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => form.setValue('foto_url', null)}
                  className="absolute top-1 right-1 bg-destructive text-white rounded-full p-1"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-24 h-24 border-2 border-dashed rounded-lg cursor-pointer hover:bg-accent/50 transition-colors">
                {isUploading ? (
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                ) : (
                  <Upload className="w-6 h-6 text-muted-foreground" />
                )}
                <span className="text-[10px] mt-1 text-muted-foreground">Upload</span>
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                />
              </label>
            )}
          </div>
        </div>
        <Button
          type="submit"
          className="w-full bg-[#066abc] hover:bg-[#066abc]/90"
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <CheckCircle className="mr-2 h-4 w-4" />
          )}
          {isEditing ? "Salvar Alterações" : "Confirmar Recebimento"}
        </Button>
      </form>
    </Form>
  );
};

export default ReceiptForm;