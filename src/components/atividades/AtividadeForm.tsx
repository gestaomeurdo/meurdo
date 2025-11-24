import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { showSuccess, showError } from "@/utils/toast";
import { CalendarIcon, Upload, Loader2, Paperclip, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { Atividade, AtividadeStatus, useCreateAtividade, useUpdateAtividade } from "@/hooks/use-atividades";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";

const statusOptions: AtividadeStatus[] = ['Em andamento', 'Concluída', 'Pendente'];

const AtividadeSchema = z.object({
  obra_id: z.string().uuid("Obra inválida."),
  data_atividade: z.date({ required_error: "A data é obrigatória." }),
  descricao: z.string().min(10, "A descrição deve ter pelo menos 10 caracteres."),
  tempo_gasto: z.coerce.number().positive("O tempo deve ser um número positivo.").optional().nullable(),
  status: z.enum(statusOptions),
  anexos: z.array(z.object({ name: z.string(), url: z.string() })).optional().nullable(),
  files: z.any().optional(),
});

type AtividadeFormValues = z.infer<typeof AtividadeSchema>;

interface AtividadeFormProps {
  obraId: string;
  initialData?: Atividade;
  onSuccess: () => void;
}

const AtividadeForm = ({ obraId, initialData, onSuccess }: AtividadeFormProps) => {
  const isEditing = !!initialData;
  const createMutation = useCreateAtividade();
  const updateMutation = useUpdateAtividade();
  const [isUploading, setIsUploading] = useState(false);

  const form = useForm<AtividadeFormValues>({
    resolver: zodResolver(AtividadeSchema),
    defaultValues: {
      obra_id: obraId,
      data_atividade: initialData?.data_atividade ? new Date(initialData.data_atividade) : new Date(),
      descricao: initialData?.descricao || "",
      tempo_gasto: initialData?.tempo_gasto || undefined,
      status: initialData?.status || 'Em andamento',
      anexos: initialData?.anexos || [],
    },
  });

  const handleFileUpload = async (files: FileList): Promise<{ name: string; url: string }[]> => {
    if (!files || files.length === 0) return [];
    setIsUploading(true);
    const uploadedAnexos = [];

    for (const file of Array.from(files)) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${file.name}`;
      const filePath = `atividades/${obraId}/${fileName}`;

      try {
        const { error: uploadError } = await supabase.storage.from('documentos_atividades').upload(filePath, file);
        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage.from('documentos_atividades').getPublicUrl(filePath);
        uploadedAnexos.push({ name: file.name, url: publicUrlData.publicUrl });
      } catch (error) {
        showError(`Erro ao enviar o arquivo ${file.name}.`);
        console.error("Upload error:", error);
      }
    }
    setIsUploading(false);
    return uploadedAnexos;
  };

  const onSubmit = async (values: AtividadeFormValues) => {
    try {
      let newAnexos = values.anexos || [];
      if (values.files && values.files.length > 0) {
        const uploaded = await handleFileUpload(values.files);
        newAnexos = [...newAnexos, ...uploaded];
      }

      const dataToSubmit = {
        ...values,
        data_atividade: format(values.data_atividade, 'yyyy-MM-dd'),
        anexos: newAnexos,
      };

      if (isEditing && initialData) {
        await updateMutation.mutateAsync({ ...dataToSubmit, id: initialData.id });
        showSuccess("Atividade atualizada com sucesso!");
      } else {
        await createMutation.mutateAsync(dataToSubmit);
        showSuccess("Atividade criada com sucesso!");
      }
      onSuccess();
    } catch (error) {
      showError(`Erro ao salvar atividade: ${error instanceof Error ? error.message : "Erro desconhecido"}`);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending || isUploading;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="data_atividade"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Data da Atividade</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {field.value ? format(field.value, "dd/MM/yyyy") : <span>Selecione a data</span>}
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField control={form.control} name="descricao" render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição do que foi feito</FormLabel>
              <FormControl><Textarea placeholder="Detalhe as tarefas realizadas, problemas encontrados, etc." {...field} rows={5} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="tempo_gasto" render={({ field }) => (
              <FormItem>
                <FormLabel>Tempo Gasto (minutos)</FormLabel>
                <FormControl><Input type="number" placeholder="Ex: 120" {...field} value={field.value ?? ''} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField control={form.control} name="status" render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Selecione o status" /></SelectTrigger></FormControl>
                  <SelectContent>{statusOptions.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField control={form.control} name="files" render={({ field: { onChange } }) => (
            <FormItem>
              <FormLabel>Anexos (fotos, PDFs)</FormLabel>
              <FormControl>
                <div className="flex items-center gap-4">
                  <label htmlFor="anexo-upload" className={cn("flex items-center gap-2 cursor-pointer text-sm text-primary hover:underline", isLoading && "opacity-50 cursor-not-allowed")}>
                    <Upload className="h-4 w-4" /> Adicionar Arquivos
                  </label>
                  <Input id="anexo-upload" type="file" multiple className="hidden" onChange={(e) => onChange(e.target.files)} disabled={isLoading} />
                  {isUploading && <Loader2 className="h-4 w-4 animate-spin" />}
                </div>
              </FormControl>
              <div className="mt-2 space-y-2">
                {form.watch('anexos')?.map((anexo, index) => (
                  <div key={index} className="flex items-center justify-between text-sm p-2 bg-muted rounded-md">
                    <a href={anexo.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 truncate hover:underline">
                      <Paperclip className="h-4 w-4" /> {anexo.name}
                    </a>
                    <Button variant="ghost" size="icon" type="button" onClick={() => {
                      const currentAnexos = form.getValues('anexos') || [];
                      form.setValue('anexos', currentAnexos.filter((_, i) => i !== index));
                    }}><X className="h-4 w-4" /></Button>
                  </div>
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isLoading}>
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {isEditing ? "Salvar Alterações" : "Salvar Atividade"}
        </Button>
      </form>
    </Form>
  );
};

export default AtividadeForm;