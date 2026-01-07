import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Obra, useCreateObra, useUpdateObra } from "@/hooks/use-obras";
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
import { parseCurrencyInput, formatCurrencyForInput } from "@/utils/formatters";
import { useCurrencyInput } from "@/hooks/use-currency-input";

const ObraSchema = z.object({
  nome: z.string().min(3, "O nome é obrigatório."),
  endereco: z.string().optional().nullable(),
  dono_cliente: z.string().optional().nullable(),
  responsavel_tecnico: z.string().optional().nullable(),
  data_inicio: z.date({ required_error: "Data de início é obrigatória." }),
  previsao_entrega: z.date().optional().nullable(),
  orcamento_inicial: z.string().min(1, "O orçamento é obrigatório."),
  status: z.enum(['ativa', 'concluida', 'pausada']),
}).refine((data) => {
    const parsedValue = parseCurrencyInput(data.orcamento_inicial);
    return parsedValue >= 0;
}, {
    message: "O orçamento deve ser um valor numérico positivo.",
    path: ["orcamento_inicial"],
});

type ObraFormValues = z.infer<typeof ObraSchema>;

interface ObraFormProps {
  initialData?: Obra;
  onSuccess: () => void;
}

const ObraForm = ({ initialData, onSuccess }: ObraFormProps) => {
  const isEditing = !!initialData;
  const createMutation = useCreateObra();
  const updateMutation = useUpdateObra();

  const form = useForm<ObraFormValues>({
    resolver: zodResolver(ObraSchema),
    defaultValues: {
      nome: initialData?.nome || "",
      endereco: initialData?.endereco || "",
      dono_cliente: initialData?.dono_cliente || "",
      responsavel_tecnico: initialData?.responsavel_tecnico || "",
      data_inicio: initialData?.data_inicio ? new Date(initialData.data_inicio) : new Date(),
      previsao_entrega: initialData?.previsao_entrega ? new Date(initialData.previsao_entrega) : null,
      orcamento_inicial: initialData?.orcamento_inicial !== undefined 
        ? formatCurrencyForInput(initialData.orcamento_inicial) 
        : "0,00",
      status: initialData?.status || 'ativa',
    },
  });

  const { handleCurrencyChange } = useCurrencyInput('orcamento_inicial', form.setValue, form.getValues);

  const onSubmit = async (values: ObraFormValues) => {
    try {
      const parsedOrcamento = parseCurrencyInput(values.orcamento_inicial);

      const payload = {
        nome: values.nome,
        endereco: values.endereco || null,
        dono_cliente: values.dono_cliente || null,
        responsavel_tecnico: values.responsavel_tecnico || null,
        data_inicio: format(values.data_inicio, 'yyyy-MM-dd'),
        previsao_entrega: values.previsao_entrega ? format(values.previsao_entrega, 'yyyy-MM-dd') : null,
        orcamento_inicial: parsedOrcamento,
        status: values.status,
      };

      if (isEditing && initialData) {
        await updateMutation.mutateAsync({ ...payload, id: initialData.id });
        showSuccess("Obra atualizada com sucesso!");
      } else {
        await createMutation.mutateAsync(payload);
        showSuccess("Obra criada com sucesso!");
      }
      onSuccess();
    } catch (error) {
      console.error("[ObraForm] Submit error:", error);
      showError(`Erro ao salvar obra: ${error instanceof Error ? error.message : "Erro interno"}`);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="nome"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome da Obra</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Residência Alphaville" {...field} value={field.value || ""} disabled={isLoading} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="endereco"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Endereço</FormLabel>
              <FormControl>
                <Textarea placeholder="Rua, número, bairro..." {...field} value={field.value || ""} disabled={isLoading} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="dono_cliente"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Dono/Cliente</FormLabel>
                <FormControl>
                  <Input placeholder="Nome do cliente" {...field} value={field.value || ""} disabled={isLoading} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="responsavel_tecnico"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Responsável Técnico</FormLabel>
                <FormControl>
                  <Input placeholder="Nome do engenheiro/arquiteto" {...field} value={field.value || ""} disabled={isLoading} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="data_inicio"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel className="mb-1">Data de Início</FormLabel>
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
            name="previsao_entrega"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel className="mb-1">Previsão de Entrega</FormLabel>
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
                      selected={field.value || undefined}
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
                <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="ativa">Ativa</SelectItem>
                    <SelectItem value="concluida">Concluída</SelectItem>
                    <SelectItem value="pausada">Pausada</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="orcamento_inicial"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Orçamento Inicial (R$)</FormLabel>
              <FormControl>
                <Input 
                  type="text" 
                  placeholder="0,00" 
                  {...field} 
                  onChange={(e) => {
                    field.onChange(e);
                    handleCurrencyChange(e);
                  }}
                  disabled={isLoading} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : isEditing ? (
            "Salvar Alterações"
          ) : (
            "Criar Obra"
          )}
        </Button>
      </form>
    </Form>
  );
};

export default ObraForm;