import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { showSuccess, showError } from "@/utils/toast";
import { CalendarIcon, Loader2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { Atividade, AtividadeStatus, useCreateAtividade, useUpdateAtividade } from "@/hooks/use-atividades";

const statusOptions: AtividadeStatus[] = ['Em andamento', 'Concluída', 'Pendente'];

const AtividadeSchema = z.object({
  obra_id: z.string().uuid("Obra inválida."),
  data_atividade: z.date({ required_error: "A data é obrigatória." }),
  descricao: z.string().min(10, "A descrição deve ter pelo menos 10 caracteres."),
  tempo_gasto: z.coerce.number().positive("O tempo deve ser um número positivo.").optional().nullable(),
  status: z.enum(statusOptions),
  pedagio: z.coerce.number().nonnegative("O valor do pedágio não pode ser negativo.").optional().nullable(),
  km_rodado: z.coerce.number().nonnegative("O valor de KM não pode ser negativo.").optional().nullable(),
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

  const form = useForm<AtividadeFormValues>({
    resolver: zodResolver(AtividadeSchema),
    defaultValues: {
      obra_id: obraId,
      data_atividade: initialData?.data_atividade ? new Date(initialData.data_atividade) : new Date(),
      descricao: initialData?.descricao || "",
      tempo_gasto: initialData?.tempo_gasto || undefined,
      status: initialData?.status || 'Em andamento',
      pedagio: initialData?.pedagio || undefined,
      km_rodado: initialData?.km_rodado || undefined,
    },
  });

  const onSubmit = async (values: AtividadeFormValues) => {
    try {
      const dataToSubmit = {
        ...values,
        data_atividade: format(values.data_atividade, 'yyyy-MM-dd'),
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

  const isLoading = createMutation.isPending || updateMutation.isPending;

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
        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="pedagio" render={({ field }) => (
              <FormItem>
                <FormLabel>Pedágio (R$)</FormLabel>
                <FormControl><Input type="number" placeholder="Ex: 12.50" {...field} value={field.value ?? ''} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField control={form.control} name="km_rodado" render={({ field }) => (
              <FormItem>
                <FormLabel>KM Rodado</FormLabel>
                <FormControl><Input type="number" placeholder="Ex: 80" {...field} value={field.value ?? ''} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {isEditing ? "Salvar Alterações" : "Salvar Atividade"}
        </Button>
      </form>
    </Form>
  );
};

export default AtividadeForm;