"use client";

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
import { CalendarIcon, Loader2, Home, Building2, ArrowRight, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { parseCurrencyInput, formatCurrencyForInput } from "@/utils/formatters";
import { useCurrencyInput } from "@/hooks/use-currency-input";
import { useState } from "react";

const ObraSchema = z.object({
  nome: z.string().min(3, "O nome deve ter pelo menos 3 caracteres."),
  endereco: z.string().optional().nullable(),
  dono_cliente: z.string().optional().nullable(),
  responsavel_tecnico: z.string().optional().nullable(),
  data_inicio: z.date({ required_error: "A data de início é obrigatória." }),
  previsao_entrega: z.date().optional().nullable(),
  orcamento_inicial: z.string().min(1, "O orçamento é obrigatório."),
  status: z.enum(['ativa', 'concluida', 'pausada']),
  modelo_id: z.string().optional(),
}).refine((data) => {
    const parsedValue = parseCurrencyInput(data.orcamento_inicial);
    return parsedValue >= 0;
}, {
    message: "O orçamento não pode ser negativo.",
    path: ["orcamento_inicial"],
});

type ObraFormValues = z.infer<typeof ObraSchema>;

interface ObraFormProps {
  initialData?: Obra;
  onSuccess: () => void;
}

const ObraForm = ({ initialData, onSuccess }: ObraFormProps) => {
  const isEditing = !!initialData;
  const [step, setStep] = useState(isEditing ? 2 : 1);
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
      modelo_id: "",
    },
  });

  const { handleCurrencyChange } = useCurrencyInput('orcamento_inicial', form.setValue, form.getValues);

  const onSubmit = async (values: ObraFormValues) => {
    try {
      const parsedOrcamento = parseCurrencyInput(values.orcamento_inicial);

      const payload = {
        nome: values.nome.trim(),
        endereco: values.endereco?.trim() || null,
        dono_cliente: values.dono_cliente?.trim() || null,
        responsavel_tecnico: values.responsavel_tecnico?.trim() || null,
        data_inicio: format(values.data_inicio, 'yyyy-MM-dd'),
        previsao_entrega: values.previsao_entrega ? format(values.previsao_entrega, 'yyyy-MM-dd') : null,
        orcamento_inicial: parsedOrcamento,
        status: values.status,
        modelo_id: values.modelo_id,
      };

      if (isEditing && initialData) {
        await updateMutation.mutateAsync({ ...payload, id: initialData.id });
        showSuccess("Obra atualizada com sucesso!");
      } else {
        await createMutation.mutateAsync(payload);
        showSuccess("Obra criada com sucesso!");
      }
      
      // Chamamos onSuccess para fechar o diálogo apenas após o sucesso da mutação
      onSuccess();
    } catch (error) {
      console.error("[ObraForm] Erro na submissão:", error);
      showError(`Erro ao salvar: ${error instanceof Error ? error.message : "Erro desconhecido"}`);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  if (step === 1 && !isEditing) {
    return (
      <div className="space-y-6 py-4">
        <div className="text-center space-y-2">
            <h3 className="text-lg font-bold text-foreground">Qual o tipo desta construção?</h3>
            <p className="text-sm text-muted-foreground">Isso configurará as etapas iniciais do seu cronograma.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => { form.setValue('modelo_id', 'residencial-padrao'); setStep(2); }}
            className={cn(
                "flex flex-col items-center gap-4 p-6 rounded-2xl border-2 transition-all text-left hover:border-[#066abc] hover:bg-accent/50 group",
                form.watch('modelo_id') === 'residencial-padrao' ? "border-[#066abc] bg-[#066abc]/5" : "border-muted"
            )}
          >
            <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center text-[#066abc] group-hover:scale-110 transition-transform">
                <Home className="w-7 h-7" />
            </div>
            <div className="text-center">
                <h4 className="font-bold text-foreground">Residencial</h4>
                <p className="text-xs text-muted-foreground mt-1">Casas, sobrados e reformas com foco em alvenaria e acabamento.</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => { form.setValue('modelo_id', 'empresarial-galpao'); setStep(2); }}
            className={cn(
                "flex flex-col items-center gap-4 p-6 rounded-2xl border-2 transition-all text-left hover:border-[#066abc] hover:bg-accent/50 group",
                form.watch('modelo_id') === 'empresarial-galpao' ? "border-[#066abc] bg-[#066abc]/5" : "border-muted"
            )}
          >
            <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center text-[#066abc] group-hover:scale-110 transition-transform">
                <Building2 className="w-7 h-7" />
            </div>
            <div className="text-center">
                <h4 className="font-bold text-foreground">Empresarial / Galpão</h4>
                <p className="text-xs text-muted-foreground mt-1">Estruturas pesadas, pré-moldados e instalações industriais.</p>
            </div>
          </button>
        </div>

        <div className="pt-4 flex justify-center">
            <Button variant="ghost" className="text-muted-foreground" onClick={() => { form.setValue('modelo_id', ''); setStep(2); }}>
                Criar sem modelo de cronograma
                <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
        </div>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {!isEditing && (
            <div className="flex items-center gap-2 text-xs font-bold text-[#066abc] uppercase tracking-widest mb-2">
                <CheckCircle2 className="w-4 h-4" />
                Modelo: {form.watch('modelo_id') === 'residencial-padrao' ? 'Residencial' : form.watch('modelo_id') === 'empresarial-galpao' ? 'Empresarial' : 'Personalizado'}
                <button type="button" onClick={() => setStep(1)} className="ml-auto underline hover:text-primary" disabled={isLoading}>Alterar</button>
            </div>
        )}

        <FormField
          control={form.control}
          name="nome"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome da Obra</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Galpão Logístico Alpha" {...field} value={field.value || ""} disabled={isLoading} />
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
              <FormLabel>Endereço Completo</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Rua, número, bairro, cidade, estado..." 
                  {...field} 
                  value={field.value || ""} 
                  disabled={isLoading}
                  rows={2}
                />
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
                <FormLabel>Dono / Cliente</FormLabel>
                <FormControl>
                  <Input placeholder="Nome do proprietário" {...field} value={field.value || ""} disabled={isLoading} />
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
                  <Input placeholder="Engenheiro ou Arquiteto" {...field} value={field.value || ""} disabled={isLoading} />
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
                        {field.value ? format(field.value, "dd/MM/yyyy") : <span>Selecione</span>}
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
                        {field.value ? format(field.value, "dd/MM/yyyy") : <span>Opcional</span>}
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
                      <SelectValue placeholder="Selecione" />
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

        <div className="flex gap-3">
            {!isEditing && (
                <Button type="button" variant="outline" onClick={() => setStep(1)} disabled={isLoading}>
                    <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
                </Button>
            )}
            <Button type="submit" disabled={isLoading} className="flex-1 bg-[#066abc] hover:bg-[#066abc]/90">
                {isLoading ? (
                    <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando Dados...
                    </>
                ) : isEditing ? (
                    "Salvar Alterações"
                ) : (
                    "Concluir e Criar Obra"
                )}
            </Button>
        </div>
      </form>
    </Form>
  );
};

export default ObraForm;