import { useForm, FormProvider, useFormContext } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { showSuccess, showError } from "@/utils/toast";
import { CalendarIcon, Loader2, Save, FileDown, DollarSign, CheckCircle, Trash2, CloudRain, Clock } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { DiarioObra, RdoClima, RdoStatusDia, useCreateRdo, useUpdateRdo, usePayRdo, useDeleteRdo, WorkforceType } from "@/hooks/use-rdo";
import RdoActivitiesForm from "./RdoActivitiesForm";
import RdoManpowerForm from "./RdoManpowerForm";
import RdoEquipmentForm from "./RdoEquipmentForm";
import RdoMaterialsForm from "./RdoMaterialsForm"; // NEW
import RdoSignaturePad from "./RdoSignaturePad"; // NEW
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMemo, useEffect, useState } from "react";
import { formatCurrency } from "@/utils/formatters";
import { generateRdoPdf } from "@/utils/rdo-pdf";
import { useObras } from "@/hooks/use-obras";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";

const statusOptions: RdoStatusDia[] = ['Operacional', 'Parcialmente Paralisado', 'Totalmente Paralisado - Não Praticável'];
const climaOptions: RdoClima[] = ['Sol', 'Nublado', 'Chuva Leve', 'Chuva Forte'];
const workforceTypes: WorkforceType[] = ['Própria', 'Terceirizada'];

const RdoDetailSchema = z.object({
  descricao_servico: z.string().min(5, "Descrição é obrigatória."),
  avanco_percentual: z.number().min(0).max(100),
  foto_anexo_url: z.string().nullable().optional(),
});

const ManpowerSchema = z.object({
  funcao: z.string().min(3, "Função é obrigatória."),
  quantidade: z.number().min(0),
  custo_unitario: z.number().min(0).optional(),
  tipo: z.enum(workforceTypes), // NEW
});

const EquipmentSchema = z.object({
  equipamento: z.string().min(3, "Equipamento é obrigatório."),
  horas_trabalhadas: z.number().min(0),
  horas_paradas: z.number().min(0),
});

const MaterialSchema = z.object({ // NEW
  nome_material: z.string().min(3, "Nome é obrigatório."),
  unidade: z.string().min(1, "Unidade é obrigatória."),
  quantidade_entrada: z.number().min(0).optional(),
  quantidade_consumida: z.number().min(0).optional(),
  observacao: z.string().nullable().optional(),
});

const RdoSchema = z.object({
  obra_id: z.string().uuid("Obra inválida."),
  data_rdo: z.date({ required_error: "A data é obrigatória." }),
  clima_condicoes: z.enum(climaOptions).nullable().optional(),
  status_dia: z.enum(statusOptions, { required_error: "O status do dia é obrigatório." }),
  observacoes_gerais: z.string().nullable().optional(),
  impedimentos_comentarios: z.string().nullable().optional(),
  
  // New fields
  responsible_signature_url: z.string().nullable().optional(),
  client_signature_url: z.string().nullable().optional(),
  work_stopped: z.boolean().default(false),
  hours_lost: z.number().min(0).max(24).default(0),

  atividades: z.array(RdoDetailSchema).min(1, "Pelo menos uma atividade deve ser registrada."),
  mao_de_obra: z.array(ManpowerSchema).optional(),
  equipamentos: z.array(EquipmentSchema).optional(),
  materiais: z.array(MaterialSchema).optional(), // NEW
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
  const deleteMutation = useDeleteRdo();
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
      
      // New fields defaults
      responsible_signature_url: initialData?.responsible_signature_url || null,
      client_signature_url: initialData?.client_signature_url || null,
      work_stopped: initialData?.work_stopped || false,
      hours_lost: initialData?.hours_lost || 0,

      atividades: initialData?.rdo_atividades_detalhe?.map(a => ({
        descricao_servico: a.descricao_servico,
        avanco_percentual: a.avanco_percentual,
        foto_anexo_url: a.foto_anexo_url,
      })) || [{ descricao_servico: "", avanco_percentual: 0, foto_anexo_url: null }],
      
      mao_de_obra: initialData?.rdo_mao_de_obra?.map(m => ({
        funcao: m.funcao,
        quantidade: m.quantidade,
        custo_unitario: m.custo_unitario,
        tipo: m.tipo || 'Própria', // Ensure default type if missing
      })) || [],
      
      equipamentos: initialData?.rdo_equipamentos?.map(e => ({
        equipamento: e.equipamento,
        horas_trabalhadas: e.horas_trabalhadas,
        horas_paradas: e.horas_paradas,
      })) || [],
      
      materiais: initialData?.rdo_materiais?.map(m => ({ // NEW
        nome_material: m.nome_material,
        unidade: m.unidade,
        quantidade_entrada: m.quantidade_entrada,
        quantidade_consumida: m.quantidade_consumida,
        observacao: m.observacao,
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
          tipo: m.tipo || 'Própria', // Ensure type is carried over
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
      
      if (previousRdoData.rdo_materiais && previousRdoData.rdo_materiais.length > 0) {
        methods.setValue("materiais", previousRdoData.rdo_materiais.map(m => ({
          nome_material: m.nome_material,
          unidade: m.unidade,
          quantidade_entrada: 0, // Reset entry quantity
          quantidade_consumida: 0, // Reset consumed quantity
          observacao: m.observacao,
        })));
      }
    }
  }, [previousRdoData, isEditing, methods]);

  const watchManpower = methods.watch("mao_de_obra");
  const watchClima = methods.watch("clima_condicoes");
  const watchWorkStopped = methods.watch("work_stopped");
  const watchHoursLost = methods.watch("hours_lost");
  const watchResponsibleSig = methods.watch("responsible_signature_url");
  const watchClientSig = methods.watch("client_signature_url");
  
  const estimatedDailyCost = useMemo(() => {
    return watchManpower?.reduce((sum, item) => sum + (item.quantidade * (item.custo_unitario || 0)), 0) || 0;
  }, [watchManpower]);

  const handleExportPdf = () => {
    if (initialData) {
      // Ensure we pass the latest data including signatures
      const currentData: DiarioObra = {
        ...initialData,
        responsible_signature_url: watchResponsibleSig,
        client_signature_url: watchClientSig,
        work_stopped: watchWorkStopped,
        hours_lost: watchHoursLost,
        rdo_mao_de_obra: methods.getValues('mao_de_obra') as any,
        rdo_materiais: methods.getValues('materiais') as any,
      };
      generateRdoPdf(currentData, obraNome);
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
  
  const handleSignatureSave = (url: string, type: 'responsible' | 'client') => {
    if (type === 'responsible') {
        methods.setValue('responsible_signature_url', url, { shouldDirty: true });
    } else {
        methods.setValue('client_signature_url', url, { shouldDirty: true });
    }
  };

  const onSubmit = async (values: RdoFormValues) => {
    try {
      const dataToSubmit = {
        ...values,
        data_rdo: format(values.data_rdo, 'yyyy-MM-dd'),
        mao_de_obra: values.mao_de_obra?.map(m => ({ ...m, custo_unitario: m.custo_unitario || 0 })) || [],
        // Ensure hours_lost is 0 if work_stopped is false
        hours_lost: values.work_stopped ? values.hours_lost : 0,
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
  
  // Conditional rendering for weather fields
  const isRainy = watchClima?.includes('Chuva');

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
              <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
                <AlertDialogTrigger asChild>
                  <Button
                    type="button"
                    variant="destructive"
                    className="flex-1 sm:flex-none"
                    disabled={isDeleting}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    {isDeleting ? "Excluindo..." : "Excluir RDO"}
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
        </div>
        
        {/* Conditional Weather Fields */}
        {isRainy && (
            <div className="p-4 border border-yellow-500/50 rounded-xl bg-yellow-50/10 space-y-4">
                <div className="flex items-center text-sm font-semibold text-yellow-700">
                    <CloudRain className="w-4 h-4 mr-2" /> Condições Climáticas
                </div>
                <FormField control={methods.control} name="work_stopped" render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-lg border p-3">
                        <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                        <div className="space-y-1 leading-none">
                            <FormLabel>Houve paralisação total ou parcial devido ao clima?</FormLabel>
                        </div>
                    </FormItem>
                )}
                />
                {watchWorkStopped && (
                    <FormField control={methods.control} name="hours_lost" render={({ field }) => (
                        <FormItem>
                            <FormLabel className="flex items-center">
                                <Clock className="w-4 h-4 mr-2" /> Horas Perdidas (0.0 a 24.0)
                            </FormLabel>
                            <FormControl>
                                <Input type="number" step="0.5" placeholder="Ex: 4.5" {...field} value={field.value || 0} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                    />
                )}
            </div>
        )}

        <Tabs defaultValue="atividades" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="atividades">Atividades</TabsTrigger>
            <TabsTrigger value="mao_de_obra">Mão de Obra</TabsTrigger>
            <TabsTrigger value="equipamentos">Equipamentos</TabsTrigger>
            <TabsTrigger value="materiais">Materiais</TabsTrigger> {/* NEW TAB */}
            <TabsTrigger value="ocorrencias">Ocorrências</TabsTrigger>
          </TabsList>
          <TabsContent value="atividades" className="pt-4"><RdoActivitiesForm obraId={obraId} /></TabsContent>
          <TabsContent value="mao_de_obra" className="pt-4"><RdoManpowerForm /></TabsContent>
          <TabsContent value="equipamentos" className="pt-4"><RdoEquipmentForm /></TabsContent>
          <TabsContent value="materiais" className="pt-4"><RdoMaterialsForm /></TabsContent> {/* NEW CONTENT */}
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
        
        {/* Signatures Section */}
        <div className="pt-6 border-t">
            <h2 className="text-xl font-bold mb-4">Assinaturas de Validação</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <RdoSignaturePad 
                    diarioId={initialData?.id || 'new'}
                    obraId={obraId}
                    signatureType="responsible"
                    currentSignatureUrl={watchResponsibleSig}
                    onSignatureSave={(url) => handleSignatureSave(url, 'responsible')}
                />
                <RdoSignaturePad 
                    diarioId={initialData?.id || 'new'}
                    obraId={obraId}
                    signatureType="client"
                    currentSignatureUrl={watchClientSig}
                    onSignatureSave={(url) => handleSignatureSave(url, 'client')}
                />
            </div>
        </div>
        
        <div className="flex justify-end pt-4">
            <Button type="submit" disabled={isSaving} className="min-w-[150px]">
              {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Salvar RDO
            </Button>
        </div>
      </form>
    </FormProvider>
  );
};

export default RdoForm;