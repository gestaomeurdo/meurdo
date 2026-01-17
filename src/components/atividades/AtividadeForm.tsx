import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { showSuccess, showError } from "@/utils/toast";
import { CalendarIcon, Loader2, User } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { Atividade, useCreateAtividade, useUpdateAtividade } from "@/hooks/use-atividades";

const etapasObra = [
  "Serviços Preliminares",
  "Fundação",
  "Estrutura",
  "Alvenaria",
  "Instalações Elétricas",
  "Instalações Hidráulicas",
  "Revestimento",
  "Acabamento",
  "Pintura",
  "Limpeza de Obra"
];

const AtividadeSchema = z.object({
  obra_id: z.string().uuid("Obra inválida."),
  data_atividade: z.date({ required_error: "A data de início é obrigatória." }),
  data_prevista: z.date().optional().nullable(),
  descricao: z.string().min(3, "A descrição deve ter pelo menos 3 caracteres."),
  responsavel_nome: z.string().optional().nullable(),
  etapa: z.string().optional().nullable(),
  progresso_atual: z.coerce.number().min(0).max(100),
  status: z.enum(['Em andamento', 'Concluída', 'Pendente', 'Pausada']),
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
      data_prevista: initialData?.data_prevista ? new Date(initialData.data_prevista) : null,
      descricao: initialData?.descricao || "",
      responsavel_nome: initialData?.responsavel_nome || "",
      etapa: initialData?.etapa || "",
      progresso_atual: initialData?.progresso_atual || 0,
      status: (initialData?.status as any) || 'Em andamento',
    },
  });

  const onSubmit = async (values: AtividadeFormValues) => {
    try {
      const dataToSubmit = {
        ...values,
        data_atividade: format(values.data_atividade, 'yyyy-MM-dd'),
        data_prevista: values.data_prevista ? format(values.data_prevista, 'yyyy-MM-dd') : null,
      };

      if (isEditing && initialData) {
        await updateMutation.mutateAsync({
          ...dataToSubmit,
          id: initialData.id
        } as any);
        showSuccess("Atividade atualizada com sucesso!");
      } else {
        await createMutation.mutateAsync(dataToSubmit as any);
        showSuccess("Nova atividade cadastrada!");
      }
      onSuccess();
    } catch (error) {
      showError(`Erro ao salvar: ${error instanceof Error ? error.message : "Erro desconhecido"}`);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Campos visíveis sempre (Criação e Edição) */}
        <FormField
          control={form.control}
          name="descricao"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome da Atividade / Serviço</FormLabel>
              <FormControl>
                <Input
                  placeholder="Ex: Assentamento de porcelanato piso térreo"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="etapa"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Etapa da Obra</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value || undefined}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a etapa" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {etapasObra.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Campos visíveis APENAS na Edição */}
        {isEditing && (
          <div className="space-y-4 pt-4 border-t mt-4 animate-in fade-in slide-in-from-top-2">
            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2">Detalhamento Técnico</h3>
            
            <FormField
              control={form.control}
              name="responsavel_nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Responsável Técnico / Encarregado</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        className="pl-9"
                        placeholder="Nome do profissional"
                        {...field}
                        value={field.value || ""}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="data_atividade"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Início Planejado</FormLabel>
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
                      <PopoverContent className="w-auto p-0">
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
                name="data_prevista"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Previsão de Conclusão</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                          >
                            {field.value ? format(field.value, "dd/MM/yyyy") : "Opcional"}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
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
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="progresso_atual"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Avanço Físico (%)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status Operacional</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Em andamento">Em andamento</SelectItem>
                        <SelectItem value="Concluída">Concluída</SelectItem>
                        <SelectItem value="Pendente">Pendente</SelectItem>
                        <SelectItem value="Pausada">Pausada</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        )}

        <Button type="submit" disabled={isLoading} className="w-full font-bold">
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {isEditing ? "Salvar Alterações" : "Cadastrar Atividade"}
        </Button>
      </form>
    </Form>
  );
};

export default AtividadeForm;