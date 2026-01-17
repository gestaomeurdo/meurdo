import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { showSuccess, showError } from "@/utils/toast";
import { CalendarIcon, Loader2, Save, FileDown, DollarSign, CheckCircle, Trash2, CloudRain, Clock, ShieldCheck, Zap, UserCheck, PackageOpen } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { DiarioObra, RdoClima, RdoStatusDia, useCreateRdo, useUpdateRdo, usePayRdo, useDeleteRdo, WorkforceType } from "@/hooks/use-rdo";
import RdoActivitiesForm from "./RdoActivitiesForm";
import RdoManpowerForm from "./RdoManpowerForm";
import RdoEquipmentForm from "./RdoEquipmentForm";
import RdoMaterialsForm from "./RdoMaterialsForm";
import RdoSignaturePad from "./RdoSignaturePad";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMemo, useEffect, useState } from "react";
import { formatCurrency } from "@/utils/formatters";
import { generateRdoPdf } from "@/utils/rdo-pdf";
import { useObras } from "@/hooks/use-obras";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/integrations/supabase/auth-provider";
import UpgradeButton from "../subscription/UpgradeButton";
import { useMaterialReceipts } from "@/hooks/use-material-receipts";

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
  tipo: z.enum(workforceTypes),
});

const EquipmentSchema = z.object({
  equipamento: z.string().min(3, "Equipamento é obrigatório."),
  horas_trabalhadas: z.number().min(0),
  horas_paradas: z.number().min(0),
});

const MaterialSchema = z.object({
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
  responsible_signature_url: z.string().nullable().optional(),
  client_signature_url: z.string().nullable().optional(),
  signer_name: z.string().nullable().optional(),
  signer_registration: z.string().nullable().optional(),
  work_stopped: z.boolean().default(false),
  hours_lost: z.number().min(0).max(24).default(0),
  safety_nr35: z.boolean().default(false),
  safety_epi: z.boolean().default(false),
  safety_cleaning: z.boolean().default(false),
  safety_dds: z.boolean().default(false),
  atividades: z.array(RdoDetailSchema).min(1, "Pelo menos uma atividade deve ser registrada."),
  mao_de_obra: z.array(ManpowerSchema).optional(),
  equipamentos: z.array(EquipmentSchema).optional(),
  materiais: z.array(MaterialSchema).optional(),
});

type RdoFormValues = z.infer<typeof RdoSchema>;

interface RdoFormProps {
  obraId: string;
  initialData?: DiarioObra;
  onSuccess: () => void;
  previousRdoData?: DiarioObra | null;
}

const RdoForm = ({ obraId, initialData, onSuccess, previousRdoData }: RdoFormProps) => {
  const { profile } = useAuth();
  const isEditing = !!initialData;
  const isPro = profile?.subscription_status === 'active' || profile?.plan_type === 'pro';
  const createMutation = useCreateRdo();
  const updateMutation = useUpdateRdo();
  const { data: obras } = useObras();
  const obraNome = obras?.find(o => o.id === obraId)?.nome || "Obra";

  const methods = useForm<RdoFormValues>({
    resolver: zodResolver(RdoSchema),
    defaultValues: {
      obra_id: obraId,
      data_rdo: initialData?.data_rdo ? new Date(initialData.data_rdo + 'T12:00:00') : new Date(),
      clima_condicoes: initialData?.clima_condicoes || undefined,
      status_dia: initialData?.status_dia || 'Operacional',
      observacoes_gerais: initialData?.observacoes_gerais || "",
      impedimentos_comentarios: initialData?.impedimentos_comentarios || "",
      responsible_signature_url: initialData?.responsible_signature_url || null,
      client_signature_url: initialData?.client_signature_url || null,
      signer_name: (initialData as any)?.signer_name || `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim(),
      signer_registration: (initialData as any)?.signer_registration || "",
      work_stopped: initialData?.work_stopped || false,
      hours_lost: initialData?.hours_lost || 0,
      safety_nr35: initialData?.safety_nr35 || false,
      safety_epi: initialData?.safety_epi || false,
      safety_cleaning: initialData?.safety_cleaning || false,
      safety_dds: initialData?.safety_dds || false,
      atividades: initialData?.rdo_atividades_detalhe?.map(a => ({
        descricao_servico: a.descricao_servico,
        avanco_percentual: a.avanco_percentual,
        foto_anexo_url: a.foto_anexo_url,
      })) || [{ descricao_servico: "", avanco_percentual: 0, foto_anexo_url: null }],
      mao_de_obra: initialData?.rdo_mao_de_obra?.map(m => ({
        funcao: m.funcao,
        quantidade: m.quantidade,
        custo_unitario: m.custo_unitario,
        tipo: m.tipo || 'Própria',
      })) || [],
      equipamentos: initialData?.rdo_equipamentos?.map(e => ({
        equipamento: e.equipamento,
        horas_trabalhadas: e.horas_trabalhadas,
        horas_paradas: e.horas_paradas,
      })) || [],
      materiais: initialData?.rdo_materiais?.map(m => ({
        nome_material: m.nome_material,
        unidade: m.unidade,
        quantidade_entrada: m.quantidade_entrada,
        quantidade_consumida: m.quantidade_consumida,
        observacao: m.observacao,
      })) || [],
    },
  });

  const selectedDate = methods.watch("data_rdo");
  const dateStr = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '';
  const { data: dailyReceipts } = useMaterialReceipts(obraId, dateStr);

  useEffect(() => {
    if (!isEditing && dailyReceipts && dailyReceipts.length > 0) {
      const currentMaterials = methods.getValues("materiais") || [];
      if (currentMaterials.length === 0) {
        const mappedMaterials = dailyReceipts.map(r => ({
          nome_material: r.material,
          unidade: r.unidade || 'un',
          quantidade_entrada: r.quantidade,
          quantidade_consumida: 0,
          observacao: `Recebido da ${r.fornecedor || 'Fornecedor'}`,
        }));
        methods.setValue("materiais", mappedMaterials);
        showSuccess(`${dailyReceipts.length} materiais importados do estoque.`);
      }
    }
  }, [dailyReceipts, isEditing, methods]);

  const estimatedDailyCost = useMemo(() => {
    return methods.watch("mao_de_obra")?.reduce((sum, item) => sum + (item.quantidade * (item.custo_unitario || 0)), 0) || 0;
  }, [methods.watch("mao_de_obra")]);

  const handleExportPdf = () => {
    if (initialData) {
      const currentData: DiarioObra = {
        ...initialData,
        responsible_signature_url: methods.watch('responsible_signature_url'),
        client_signature_url: methods.watch('client_signature_url'),
        signer_name: methods.watch('signer_name'),
        signer_registration: methods.watch('signer_registration'),
        work_stopped: methods.watch('work_stopped'),
        hours_lost: methods.watch('hours_lost'),
        safety_nr35: methods.watch('safety_nr35'),
        safety_epi: methods.watch('safety_epi'),
        safety_cleaning: methods.watch('safety_cleaning'),
        safety_dds: methods.watch('safety_dds'),
        rdo_mao_de_obra: methods.getValues('mao_de_obra') as any,
        rdo_materiais: methods.getValues('materiais') as any,
        rdo_atividades_detalhe: methods.getValues('atividades') as any,
      };
      generateRdoPdf(currentData, obraNome, profile);
    } else {
      showError("Salve o RDO antes de exportar.");
    }
  };

  const onSubmit = async (values: RdoFormValues) => {
    try {
      const dataToSubmit = {
        ...values,
        data_rdo: format(values.data_rdo, 'yyyy-MM-dd'),
        hours_lost: values.work_stopped ? values.hours_lost : 0,
      };

      if (isEditing && initialData) {
        await updateMutation.mutateAsync({ ...dataToSubmit, id: initialData.id } as any);
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

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-primary/10 rounded-xl border border-primary/20 gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-primary p-2 rounded-lg text-primary-foreground">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-primary uppercase">Custo Estimado</p>
              <h2 className="text-2xl font-bold">{formatCurrency(estimatedDailyCost)}</h2>
            </div>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            {isEditing && (
              <Button type="button" variant="outline" onClick={handleExportPdf} className="flex-1 sm:flex-none rounded-xl">
                <FileDown className="w-4 h-4 mr-2" /> PDF
              </Button>
            )}
            <Button type="submit" disabled={updateMutation.isPending || createMutation.isPending} className="flex-1 sm:flex-none rounded-xl bg-primary hover:bg-primary/90">
              {(updateMutation.isPending || createMutation.isPending) ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Salvar Diário
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={methods.control}
            name="data_rdo"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Data do Relatório</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal rounded-xl">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {field.value ? format(field.value, "dd/MM/yyyy") : "Selecionar"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                  </PopoverContent>
                </Popover>
              </FormItem>
            )}
          />
          <FormField
            control={methods.control}
            name="status_dia"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Condição da Obra</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl><SelectTrigger className="rounded-xl"><SelectValue placeholder="Status" /></SelectTrigger></FormControl>
                  <SelectContent>{statusOptions.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </FormItem>
            )}
          />
          <FormField
            control={methods.control}
            name="clima_condicoes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Clima</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value || undefined}>
                  <FormControl><SelectTrigger className="rounded-xl"><SelectValue placeholder="Clima" /></SelectTrigger></FormControl>
                  <SelectContent>{climaOptions.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </FormItem>
            )}
          />
        </div>
        <Tabs defaultValue="atividades" className="w-full">
          <TabsList className="grid w-full grid-cols-6 h-12 bg-muted/50 p-1 rounded-xl">
            <TabsTrigger value="atividades" className="rounded-lg">Ativ.</TabsTrigger>
            <TabsTrigger value="mao_de_obra" className="rounded-lg">Equipe</TabsTrigger>
            <TabsTrigger value="seguranca" className="rounded-lg text-primary font-bold">Seg.</TabsTrigger>
            <TabsTrigger value="equipamentos" className="rounded-lg">Máq.</TabsTrigger>
            <TabsTrigger value="materiais" className="rounded-lg">Mat.</TabsTrigger>
            <TabsTrigger value="ocorrencias" className="rounded-lg">Notas</TabsTrigger>
          </TabsList>
          <TabsContent value="atividades" className="pt-4"><RdoActivitiesForm obraId={obraId} /></TabsContent>
          <TabsContent value="mao_de_obra" className="pt-4"><RdoManpowerForm /></TabsContent>
          <TabsContent value="seguranca" className="pt-4 space-y-6">
            <div className="flex items-center gap-3 border-b pb-4 mb-4">
              <ShieldCheck className="h-8 w-8 text-primary" />
              <div>
                <h3 className="text-xl font-black text-primary uppercase tracking-tight">Segurança do Trabalho</h3>
                <p className="text-xs text-muted-foreground font-medium">Cumprimento de normas e proteção da equipe.</p>
              </div>
            </div>
            {!isPro ? (
              <Card className="border-dashed border-primary/30 bg-accent/30 py-10">
                <CardContent className="flex flex-col items-center text-center space-y-4">
                  <ShieldCheck className="w-12 h-12 text-primary/40" />
                  <div className="space-y-2">
                    <h4 className="font-bold text-lg">Checklist de Segurança Avançado</h4>
                    <p className="text-sm text-muted-foreground max-w-md">Recurso exclusivo do Plano PRO.</p>
                  </div>
                  <UpgradeButton />
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { name: "safety_nr35", label: "NR-35 (Altura)", desc: "Verificação de cintos e ancoragem." },
                  { name: "safety_epi", label: "Uso de EPIs", desc: "Fiscalização ativa da equipe." },
                  { name: "safety_cleaning", label: "Limpeza", desc: "Canteiro organizado." },
                  { name: "safety_dds", label: "DDS Realizado", desc: "Diálogo de Segurança matinal." },
                ].map((item) => (
                  <FormField key={item.name} control={methods.control} name={item.name as any} render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-2xl border p-4 bg-white transition-all hover:border-primary/50">
                      <div className="space-y-0.5">
                        <FormLabel className="text-sm font-bold uppercase">{item.label}</FormLabel>
                        <FormDescription className="text-[10px]">{item.desc}</FormDescription>
                      </div>
                      <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                    </FormItem>
                  )} />
                ))}
              </div>
            )}
          </TabsContent>
          <TabsContent value="equipamentos" className="pt-4"><RdoEquipmentForm /></TabsContent>
          <TabsContent value="materiais" className="pt-4"><RdoMaterialsForm /></TabsContent>
          <TabsContent value="ocorrencias" className="pt-4 space-y-4">
            <FormField control={methods.control} name="impedimentos_comentarios" render={({ field }) => (
              <FormItem><FormLabel>Ocorrências</FormLabel><FormControl><Textarea {...field} value={field.value || ""} rows={3} placeholder="Descreva imprevistos do dia..." /></FormControl></FormItem>
            )} />
            <FormField control={methods.control} name="observacoes_gerais" render={({ field }) => (
              <FormItem><FormLabel>Observações Gerais</FormLabel><FormControl><Textarea {...field} value={field.value || ""} rows={3} placeholder="Notas adicionais do encarregado..." /></FormControl></FormItem>
            )} />
          </TabsContent>
        </Tabs>
        <div className="pt-6 border-t space-y-6">
          <div className="flex items-center gap-2"><UserCheck className="w-5 h-5 text-primary" /><h2 className="text-xl font-black uppercase tracking-tight">Assinatura Digital</h2></div>
          {!isPro ? (
            <Card className="border-dashed border-primary/30 bg-primary/5 py-8">
              <CardContent className="flex flex-col items-center text-center space-y-4">
                <Zap className="w-8 h-8 text-orange-500 fill-current" />
                <p className="text-xs text-muted-foreground">Assine seus diários e gere documentos oficiais no Plano PRO.</p>
                <UpgradeButton />
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card className="bg-muted/30 border-none rounded-2xl"><CardContent className="p-4 space-y-4">
                <FormField control={methods.control} name="signer_name" render={({ field }) => (
                  <FormItem><FormLabel className="text-xs font-bold uppercase">Responsável</FormLabel><FormControl><Input placeholder="Nome Completo" {...field} value={field.value || ""} /></FormControl></FormItem>
                )} />
                <FormField control={methods.control} name="signer_registration" render={({ field }) => (
                  <FormItem><FormLabel className="text-xs font-bold uppercase">Registro (CREA/CAU)</FormLabel><FormControl><Input placeholder="000.000-0" {...field} value={field.value || ""} /></FormControl></FormItem>
                )} />
              </CardContent></Card>
              <RdoSignaturePad diarioId={initialData?.id || 'new'} obraId={obraId} currentSignatureUrl={methods.watch('responsible_signature_url') || null} onSignatureSave={(url) => methods.setValue('responsible_signature_url', url, { shouldDirty: true })} />
            </div>
          )}
        </div>
      </form>
    </FormProvider>
  );
};

export default RdoForm;