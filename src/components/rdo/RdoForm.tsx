import { useForm, FormProvider, useFormContext } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { showSuccess, showError } from "@/utils/toast";
import { CalendarIcon, Loader2, Save, FileDown, DollarSign, CheckCircle, Trash2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { DiarioObra, RdoClima, RdoStatusDia, useCreateRdo, useUpdateRdo, usePayRdo, useDeleteRdo } from "@/hooks/use-rdo";
import RdoActivitiesForm from "./RdoActivitiesForm";
import RdoManpowerForm from "./RdoManpowerForm";
import RdoEquipmentForm from "./RdoEquipmentForm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMemo, useEffect, useState } from "react";
import { formatCurrency } from "@/utils/formatters";
import { generateRdoPdf } from "@/utils/rdo-pdf";
import { useObras } from "@/hooks/use-obras";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

const statusOptions: RdoStatusDia[] = ['Operacional', 'Parcialmente Paralisado', 'Totalmente Paralisado - Não Praticável'];
const climaOptions: RdoClima[] = ['Sol', 'Nublado', 'Chuva Leve', 'Chuva Forte'];

const RdoDetailSchema = z.object({
  descricao_servico: z.string().min(5, "Descrição é obrigatória."),
  avanco_percentual: z.number().min(0).max(100),
  foto_anexo_url: z.string().nullable().optional(),
});

const ManpowerSchema = z.object({
  funcao: z.string().min(3, "Função é obrigatória."),
  quantidade: z.number().min(0),
  custo_unitario: z.number().min(0).optional(),
});

const EquipmentSchema = z.object({
  equipamento: z.string().min(3, "Equipamento é obrigatório."),
  horas_trabalhadas: z.number().min(0),
  horas_paradas: z.number().min(0),
});

const RdoSchema = z.object({
  obra_id: z.string().uuid("Obra inválida."),
  data_rdo: z.date({ required_error: "A data é obrigatória." }),
  clima_condicoes: z.enum(climaOptions).nullable().optional(),
  status_dia: z.enum(statusOptions, { required_error: "O status do dia é obrigatório." }),
  observacoes_gerais: z.string().nullable().optional(),
  impedimentos_comentarios: z.string().nullable().optional(),
  atividades: z.array(RdoDetailSchema).min(1, "Pelo menos uma atividade deve ser registrada."),
  mao_de_obra: z.array(ManpowerSchema).optional(),
  equipamentos: z.array(EquipmentSchema).optional(),
});

type RdoFormValues = z.infer<typeof RdoSchema>;

interface RdoFormProps {
  obraId: string;
  initialData?: DiarioObra;
  onSuccess: () => void;
  previousRdoData?: DiarioObra | null; 
}

const RdoForm = ({ obraId, initialData, onSuccess, previousRdoData }: RdoFormProps) => {
  const isEditing = !!initialData;
  const createMutation = useCreateRdo();
  const updateMutation = useUpdateRdo();
  const deleteMutation = useDeleteRdo(); // New hook
  const payRdoMutation = usePayRdo();
  const queryClient = useQueryClient();
  const { data: obras } = useObras();
  const obraNome = obras?.find(o => o.id === obraId)?.nome || "Obra";
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);

  const methods = useForm<RdoFormValues>({
    resolver: zodResolver(RdoSchema),
    defaultValues: {
      obra_id: obraId,
      data_rdo: initialData?.data_rdo ? new Date(initialData.data_rdo) : new Date(),
      clima_condicoes: initialData?.clima_condicoes || undefined,
      status_dia: initialData?.status_dia || 'Operacional',
      observacoes_gerais: initialData?.observacoes_gerais || "",
      impedimentos_comentarios: initialData?.impedimentos_comentarios || "",
      atividades: initialData?.rdo_atividades_detalhe?.map(a => ({
        descricao_servico: a.descricao_servico,
        avanco_percentual: a.avanco_percentual,
        foto_anexo_url: a.foto_anexo_url,
      })) || [{ descricao_servico: "", avanco_percentual: 0, foto_anexo_url: null }],
      mao_de_obra: initialData?.rdo_mao_de_obra?.map(m => ({
        funcao: m.funcao,
        quantidade: m.quantidade,
        custo_unitario: m.custo_unitario,
      })) || [],
      equipamentos: initialData?.rdo_equipamentos?.map(e => ({
        equipamento: e.equipamento,
        horas_trabalhadas: e.horas_trabalhadas,
        horas_paradas: e.horas_paradas,
      })) || [],
    },
  });

  // Check if payment already exists for this RDO date
  const rdoDateString = format(methods.watch('data_rdo'), 'yyyy-MM-dd');
  const { data: existingPayment, isLoading: isLoadingPayment } = useQuery({
    queryKey: ['rdoPaymentCheck', obraId, rdoDateString],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lancamentos_financeiros')
        .select('id, valor')
        .eq('obra_id', obraId)
        .eq('data_gasto', rdoDateString)
        .ilike('descricao', 'Pagamento Mão de Obra RDO%') // Check for RDO payment description pattern
        .maybeSingle();
      
      if (error) {
        console.error("Error checking existing payment:", error);
        return null;
      }
      return data;
    },
    enabled: isEditing, // Only check if RDO exists (is being edited/viewed)
  });

  // Auto-populate from previous day if creating new RDO and previous data exists
  useEffect(() => {
    if (!isEditing && previousRdoData && methods.getValues("mao_de_obra")?.length === 0) {
      if (previousRdoData.rdo_mao_de_obra && previousRdoData.rdo_mao_de_obra.length > 0) {
        methods.setValue("mao_de_obra", previousRdoData.rdo_mao_de_obra.map(m => ({
          funcao: m.funcao,
          quantidade: m.quantidade,
          custo_unitario: m.custo_unitario || 0,
        })));
        showSuccess("Equipe copiada do dia anterior para facilitar o preenchimento.");
      }
      
      if (previousRdoData.rdo_equipamentos && previousRdoData.rdo_equipamentos.length > 0) {
        methods.setValue("equipamentos", previousRdoData.rdo_equipamentos.map(e => ({
          equipamento: e.equipamento,
          horas_trabalhadas: e.horas_trabalhadas,
          horas_paradas: e.horas_paradas,
        })));
      }
    }
  }, [previousRdoData, isEditing, methods]);

  const watchManpower = methods.watch("mao_de_obra");
  const estimatedDailyCost = useMemo(() => {
    return watchManpower?.reduce((sum, item) => sum + (item.quantidade * (item.custo_unitario || 0)), 0) || 0;
  }, [watchManpower]);

  const handleExportPdf = () => {
    if (initialData) {
      generateRdoPdf(initialData, obraNome);
    } else {
      showError("Salve o RDO antes de exportar.");
    }
  };

  const handlePayRdo = async () => {
    if (estimatedDailyCost <= 0) {
      showError("O custo estimado da mão de obra é zero. Não há o que pagar.");
      return;
    }
    
    if (existingPayment) {
      showError("O pagamento para este RDO já foi registrado.");
      return;
    }

    try {
      await payRdoMutation.mutateAsync({
        obraId,
        rdoDate: rdoDateString,
        totalCost: estimatedDailyCost,
        manpowerDetails: methods.getValues('mao_de_obra').map(m => ({
            funcao: m.funcao,
            quantidade: m.quantidade,
            custo_unitario: m.custo_unitario || 0,
        })),
      });
      showSuccess("Pagamento do RDO registrado com sucesso no Financeiro!");
      queryClient.invalidateQueries({ queryKey: ['rdoPaymentCheck'] }); 
    } catch (error) {
      showError(`Erro ao registrar pagamento: ${error instanceof Error ? error.message : "Erro desconhecido"}`);
    }
  };
  
  const handleDeleteRdo = async () => {
    if (!initialData?.id) return;
    try {
      await deleteMutation.mutateAsync({ id: initialData.id, obraId });
      showSuccess("RDO excluído com sucesso!");
      onSuccess(); // Close dialog
    } catch (error) {
      showError(`Erro ao excluir RDO: ${error instanceof Error ? error.message : "Erro desconhecido"}`);
    }
  };

  const onSubmit = async (values: RdoFormValues) => {
    try {
      const dataToSubmit = {
        ...values,
        data_rdo: format(values.data_rdo, 'yyyy-MM-dd'),
        mao_de_obra: values.mao_de_obra?.map(m => ({ ...m, custo_unitario: m.custo_unitario || 0 })) || [],
      };

      if (isEditing && initialData) {
        await updateMutation.mutateAsync({ ...dataToSubmit, id: initialData.id });
        showSuccess("RDO atualizado!");
      } else {
        await createMutation.mutateAsync(dataToSubmit as any);
        showSuccess("RDO criado!");
      }
      onSuccess();
    } catch (error) {
      showError(`Erro ao salvar: ${error instanceof Error ? error.message : "Erro desconhecido"}`);
    }
  };

  const isSaving = updateMutation.isPending || createMutation.isPending;
  const isDeleting = deleteMutation.isPending;
  const isPaying = payRdoMutation.isPending;
  const isPaymentRegistered = !!existingPayment;
  const canPay = isEditing && !isPaymentRegistered && estimatedDailyCost > 0;

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-primary/10 rounded-xl border border-primary/20 gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-primary p-2 rounded-lg text-primary-foreground">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-primary uppercase">Custo Estimado do Dia</p>
              <h2 className="text-2xl font-bold">{formatCurrency(estimatedDailyCost)}</h2>
            </div>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            {isEditing && (
              <Button 
                type="button" 
                variant={isPaymentRegistered ? "secondary" : "default"} 
                onClick={handlePayRdo} 
                disabled={!canPay || isPaying}
                className="flex-1 sm:flex-none"
              >
                {isPaying ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : isPaymentRegistered ? (
                  <CheckCircle className="w-4 h-4 mr-2" />
                ) : (
                  <DollarSign className="w-4 h-4 mr-2" />
                )}
                {isPaying ? "Registrando..." : isPaymentRegistered ? "Pagamento Registrado" : "Pagar RDO"}
              </Button>
            )}
            {isEditing && (
              <Button type="button" variant="outline" onClick={handleExportPdf} className="flex-1 sm:flex-none">
                <FileDown className="w-4 h-4 mr-2" /> Gerar PDF
              </Button>
            )}
            <Button type="submit" disabled={isSaving} className="flex-1 sm:flex-none">
              {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Salvar RDO
            </Button>
          </div>
        </div>

        <div className="flex justify-between items-center">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1">
                <FormField control={methods.control} name="data_rdo" render={({ field }) => (
                    <FormItem className="flex flex-col">
                        <FormLabel>Data</FormLabel>
                        <Popover>
                            <PopoverTrigger asChild><Button variant="outline" className="w-full justify-start text-left font-normal"><CalendarIcon className="mr-2 h-4 w-4" />{field.value ? format(field.value, "dd/MM/yyyy") : "Selecionar"}</Button></PopoverTrigger>
                            <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent>
                        </Popover>
                        <FormMessage />
                    </FormItem>
                )}
                />
                <FormField control={methods.control} name="status_dia" render={({ field }) => (
                    <FormItem><FormLabel>Status</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger></FormControl><SelectContent>{statusOptions.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></FormItem>
                )}
                />
                <FormField control={methods.control} name="clima_condicoes" render={({ field }) => (
                    <FormItem><FormLabel>Clima</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value || undefined}><FormControl><SelectTrigger><SelectValue placeholder="Clima" /></SelectTrigger></FormControl><SelectContent>{climaOptions.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></FormItem>
                )}
                />
            </div>
            
            {isEditing && (
                <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
                    <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="ml-4 text-destructive hover:bg-destructive/10" title="Excluir RDO">
                            <Trash2 className="w-5 h-5" />
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Confirmar Exclusão do RDO</AlertDialogTitle>
                            <AlertDialogDescription>
                                Tem certeza que deseja excluir o RDO de <span className="font-bold">{format(methods.watch('data_rdo'), 'dd/MM/yyyy')}</span>? Esta ação é irreversível e removerá todas as atividades e registros associados.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction 
                                onClick={handleDeleteRdo}
                                disabled={isDeleting}
                                className="bg-destructive hover:bg-destructive/90"
                            >
                                {isDeleting ? "Excluindo..." : "Excluir RDO"}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            )}
        </div>

        <Tabs defaultValue="atividades" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="atividades">Atividades</TabsTrigger>
            <TabsTrigger value="mao_de_obra">Mão de Obra</TabsTrigger>
            <TabsTrigger value="equipamentos">Equipamentos</TabsTrigger>
            <TabsTrigger value="ocorrencias">Ocorrências</TabsTrigger>
          </TabsList>
          <TabsContent value="atividades" className="pt-4"><RdoActivitiesForm obraId={obraId} /></TabsContent>
          <TabsContent value="mao_de_obra" className="pt-4"><RdoManpowerForm /></TabsContent>
          <TabsContent value="equipamentos" className="pt-4"><RdoEquipmentForm /></TabsContent>
          <TabsContent value="ocorrencias" className="pt-4 space-y-4">
            <FormField control={methods.control} name="impedimentos_comentarios" render={({ field }) => (
                <FormItem><FormLabel>Impedimentos</FormLabel><FormControl><Textarea {...field} value={field.value || ""} rows={3} /></FormControl></FormItem>
              )}
            />
            <FormField control={methods.control} name="observacoes_gerais" render={({ field }) => (
                <FormItem><FormLabel>Observações Gerais</FormLabel><FormControl><Textarea {...field} value={field.value || ""} rows={3} /></FormControl></FormItem>
              )}
            />
          </TabsContent>
        </Tabs>
      </form>
    </FormProvider>
  );
};

export default RdoForm;