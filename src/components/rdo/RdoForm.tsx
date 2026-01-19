"use client";

import { useForm, FormProvider, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { showSuccess, showError } from "@/utils/toast";
import { Loader2, Save, FileDown, DollarSign, Lock, ShieldCheck, UserCheck, Sun, Clock, Copy, Upload, Image as ImageIcon, X, Handshake, Moon, SunMedium, CheckCircle, Trash2, AlertTriangle, StickyNote, MessageSquare, AlertOctagon } from "lucide-react";
import { DiarioObra, useCreateRdo, useUpdateRdo, WorkforceType, useDeleteRdo, useRdoList } from "@/hooks/use-rdo";
import RdoActivitiesForm from "./RdoActivitiesForm";
import RdoManpowerForm from "./RdoManpowerForm";
import RdoEquipmentForm from "./RdoEquipmentForm";
import RdoMaterialsForm from "./RdoMaterialsForm";
import RdoSignaturePad from "./RdoSignaturePad";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMemo, useState, useEffect } from "react";
import { formatCurrency } from "@/utils/formatters";
import { generateRdoPdf } from "@/utils/rdo-pdf";
import { useObras } from "@/hooks/use-obras";
import { useAuth } from "@/integrations/supabase/auth-provider";
import UpgradeModal from "../subscription/UpgradeModal";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Label } from "@/components/ui/label";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

const workforceTypes: WorkforceType[] = ['Própria', 'Terceirizada'];

const RdoDetailSchema = z.object({
  descricao_servico: z.string().optional(),
  avanco_percentual: z.coerce.number().min(0).max(100),
  foto_anexo_url: z.string().nullable().optional(),
  observacao: z.string().nullable().optional(),
});

const ManpowerSchema = z.object({
  funcao: z.string().min(2, "Função obrigatória."),
  quantidade: z.coerce.number().min(0),
  custo_unitario: z.coerce.number().min(0).optional(),
  tipo: z.enum(workforceTypes),
  observacao: z.string().optional().nullable(),
});

const EquipmentSchema = z.object({
  equipamento: z.string().min(2, "Equipamento obrigatório."),
  horas_trabalhadas: z.coerce.number().min(0),
  horas_paradas: z.coerce.number().min(0),
  custo_hora: z.coerce.number().min(0).optional(),
  observacao: z.string().optional().nullable(),
  foto_url: z.string().optional().nullable(),
});

const MaterialSchema = z.object({
  nome_material: z.string().min(2, "Nome obrigatório."),
  unidade: z.string().min(1, "Unidade obrigatória."),
  quantidade_entrada: z.coerce.number().min(0).optional(),
  quantidade_consumida: z.coerce.number().min(0).optional(),
  observacao: z.string().nullable().optional(),
});

const RdoSchema = z.object({
  obra_id: z.string().uuid("Obra inválida."),
  data_rdo: z.date({ required_error: "A data é obrigatória." }),
  periodo: z.string().min(1, "Selecione pelo menos um período."),
  clima_condicoes: z.string().nullable().optional(),
  status_dia: z.string().optional(), 
  observacoes_gerais: z.string().nullable().optional(),
  impedimentos_comentarios: z.string().nullable().optional(),
  responsible_signature_url: z.string().nullable().optional(),
  client_signature_url: z.string().nullable().optional(),
  signer_name: z.string().nullable().optional(),
  work_stopped: z.boolean().default(false),
  hours_lost: z.coerce.number().min(0).max(24).default(0),
  
  safety_nr35: z.boolean().default(false),
  safety_epi: z.boolean().default(false),
  safety_cleaning: z.boolean().default(false),
  safety_dds: z.boolean().default(false),
  
  safety_comments: z.string().nullable().optional(),
  safety_photo_url: z.string().nullable().optional(),
  
  safety_nr35_photo: z.string().nullable().optional(),
  safety_epi_photo: z.string().nullable().optional(),
  safety_cleaning_photo: z.string().nullable().optional(),
  safety_dds_photo: z.string().nullable().optional(),

  atividades: z.array(RdoDetailSchema).optional(),
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
  selectedDate?: Date;
}

const RdoForm = ({ obraId, initialData, onSuccess, previousRdoData, selectedDate }: RdoFormProps) => {
  const { profile } = useAuth();
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const isEditing = !!initialData;
  const isPro = profile?.subscription_status === 'active' || profile?.plan_type === 'pro';
  const createMutation = useCreateRdo();
  const updateMutation = useUpdateRdo();
  const { data: obras } = useObras();
  const { data: rdoList } = useRdoList(obraId);
  const currentObra = obras?.find(o => o.id === obraId);
  const obraNome = currentObra?.nome || "Obra";
  
  const [weatherMap, setWeatherMap] = useState<Record<string, string>>({});
  const [statusMap, setStatusMap] = useState<Record<string, string>>({});

  const methods = useForm<RdoFormValues>({
    resolver: zodResolver(RdoSchema),
    defaultValues: {
      obra_id: obraId,
      data_rdo: initialData?.data_rdo 
        ? new Date(initialData.data_rdo + 'T12:00:00') 
        : (selectedDate || new Date()),
      periodo: initialData?.periodo || "Manhã, Tarde",
      clima_condicoes: initialData?.clima_condicoes || "",
      status_dia: (initialData?.status_dia as string) || 'Operacional',
      observacoes_gerais: initialData?.observacoes_gerais || "",
      impedimentos_comentarios: initialData?.impedimentos_comentarios || "",
      responsible_signature_url: initialData?.responsible_signature_url || null,
      client_signature_url: initialData?.client_signature_url || null,
      signer_name: (initialData as any)?.signer_name || `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim(),
      work_stopped: initialData?.work_stopped || false,
      hours_lost: initialData?.hours_lost || 0,
      safety_nr35: initialData?.safety_nr35 || false,
      safety_epi: initialData?.safety_epi || false,
      safety_cleaning: initialData?.safety_cleaning || false,
      safety_dds: initialData?.safety_dds || false,
      safety_comments: initialData?.safety_comments || "",
      
      safety_nr35_photo: (initialData as any)?.safety_nr35_photo || null,
      safety_epi_photo: (initialData as any)?.safety_epi_photo || null,
      safety_cleaning_photo: (initialData as any)?.safety_cleaning_photo || null,
      safety_dds_photo: (initialData as any)?.safety_dds_photo || null,

      atividades: initialData?.rdo_atividades_detalhe?.map(a => ({
        descricao_servico: a.descricao_servico,
        avanco_percentual: a.avanco_percentual,
        foto_anexo_url: a.foto_anexo_url,
        observacao: a.observacao,
      })) || [],
      mao_de_obra: initialData?.rdo_mao_de_obra?.map(m => ({
        funcao: m.funcao,
        quantidade: m.quantidade,
        custo_unitario: m.custo_unitario,
        tipo: m.tipo || 'Própria',
        observacao: (m as any).observacao,
      })) || [],
      equipamentos: initialData?.rdo_equipamentos?.map(e => ({
        equipamento: e.equipamento,
        horas_trabalhadas: e.horas_trabalhadas,
        horas_paradas: e.horas_paradas,
        custo_hora: e.custo_hora || 0,
        observacao: (e as any).observacao,
        foto_url: (e as any).foto_url,
      })) || [],
      materiais: initialData?.rdo_materiais?.map(m => ({
        nome_material: m.nome_material,
        unidade: m.unidade,
        quantidade_entrada: m.quantidade_entrada || 0,
        quantidade_consumida: m.quantidade_consumida,
        observacao: m.observacao,
      })) || [],
    },
  });

  const maoDeObra = useWatch({ control: methods.control, name: "mao_de_obra" });
  const equipamentos = useWatch({ control: methods.control, name: "equipamentos" });
  const activePeriods = methods.watch("periodo");

  useEffect(() => {
    if (initialData?.clima_condicoes) {
      const weatherString = initialData.clima_condicoes;
      if (weatherString.includes(':')) {
        const parts = weatherString.split(', ');
        const map: Record<string, string> = {};
        parts.forEach(p => {
          const [period, condition] = p.split(': ');
          if (period && condition) map[period] = condition;
        });
        setWeatherMap(map);
      }
    }
    if (initialData?.status_dia) {
        const statusString = initialData.status_dia as string;
        if (statusString.includes(':')) {
            const parts = statusString.split(', ');
            const map: Record<string, string> = {};
            parts.forEach(p => {
                const [period, status] = p.split(': ');
                if (period && status) map[period] = status;
            });
            setStatusMap(map);
        }
    }
  }, [initialData]);

  useEffect(() => {
    const selectedPeriods = activePeriods.split(', ').filter(p => p !== '');
    const weatherString = selectedPeriods.map(p => `${p}: ${weatherMap[p] || 'Sol'}`).join(', ');
    methods.setValue('clima_condicoes', weatherString, { shouldDirty: true });
    const statusString = selectedPeriods.map(p => `${p}: ${statusMap[p] || 'Operacional'}`).join(', ');
    methods.setValue('status_dia', statusString as any, { shouldDirty: true });
  }, [weatherMap, statusMap, activePeriods, methods]);

  const estimatedDailyCost = useMemo(() => {
    const manpowerCost = maoDeObra?.reduce((sum, item) => (sum + (Number(item.quantidade) * Number(item.custo_unitario || 0))), 0) || 0;
    const equipmentCost = equipamentos?.reduce((sum, item) => (sum + (Number(item.horas_trabalhadas) * Number(item.custo_hora || 0))), 0) || 0;
    return manpowerCost + equipmentCost;
  }, [maoDeObra, equipamentos]);

  const handleExportPdf = async () => {
    if (!initialData) {
      showError("Salve o RDO antes de exportar.");
      return;
    }
    setIsGeneratingPdf(true);
    try {
      const currentData: DiarioObra = {
        ...initialData,
        ...methods.getValues() as any, 
        rdo_mao_de_obra: methods.getValues('mao_de_obra') as any,
        rdo_materiais: methods.getValues('materiais') as any,
        rdo_atividades_detalhe: methods.getValues('atividades') as any,
        rdo_equipamentos: methods.getValues('equipamentos') as any,
      };
      await generateRdoPdf(currentData, obraNome, profile, currentObra, rdoList);
    } catch (err: any) {
      showError(err.message);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const onSubmit = async (values: RdoFormValues) => {
    try {
      const dataToSubmit = {
        ...values,
        data_rdo: format(values.data_rdo, 'yyyy-MM-dd'),
      };

      if (isEditing && initialData) {
        await updateMutation.mutateAsync({ ...dataToSubmit, id: initialData.id } as any);
        showSuccess("RDO atualizado!");
      } else {
        await createMutation.mutateAsync(dataToSubmit as any);
        showSuccess("RDO criado!");
      }
      onSuccess();
    } catch (error: any) {
      showError("Falha ao salvar. Verifique se já existe RDO nesta data.");
    }
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-6">
        <UpgradeModal open={showUpgrade} onOpenChange={setShowUpgrade} />

        <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-primary/10 rounded-2xl border border-primary/20 gap-4">
              <div className="flex items-center gap-3">
                <div className="bg-primary p-2 rounded-lg text-primary-foreground"><DollarSign className="w-5 h-5" /></div>
                <div>
                  <p className="text-xs font-black text-primary uppercase">Custo Estimado</p>
                  <h2 className="text-2xl font-black">{formatCurrency(estimatedDailyCost)}</h2>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                {isEditing && (
                  <Button type="button" variant="outline" onClick={handleExportPdf} disabled={isGeneratingPdf} className="flex-1 sm:flex-none rounded-xl font-bold uppercase text-xs">
                    {isGeneratingPdf ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileDown className="w-4 h-4 mr-2" />}
                    PDF
                  </Button>
                )}
                <Button type="submit" disabled={updateMutation.isPending || createMutation.isPending} className="flex-1 sm:flex-none rounded-xl bg-primary hover:bg-primary/90 font-bold uppercase text-xs">
                  {(updateMutation.isPending || createMutation.isPending) ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  Salvar
                </Button>
              </div>
            </div>
        </div>

        <Card className="border-none shadow-clean bg-accent/20">
          <CardContent className="p-4 space-y-4">
            <div className="flex gap-2">
                {['Manhã', 'Tarde', 'Noite'].map((p) => {
                    const isSelected = activePeriods.includes(p);
                    return (
                        <button key={p} type="button" onClick={() => methods.setValue('periodo', isSelected ? activePeriods.replace(p, '').replace(', ,', ',') : activePeriods + ', ' + p)} className={cn("flex-1 px-3 py-2 rounded-xl border text-xs font-bold uppercase transition-all", isSelected ? "bg-primary text-white" : "bg-white text-muted-foreground")}>{p}</button>
                    );
                })}
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="atividades" className="w-full">
          <TabsList className="grid w-full grid-cols-3 md:grid-cols-6 h-auto bg-muted/50 p-1 rounded-xl gap-1">
            <TabsTrigger value="atividades" className="rounded-lg text-[10px] uppercase font-black py-2">Serviços</TabsTrigger>
            <TabsTrigger value="mao_de_obra" className="rounded-lg text-[10px] uppercase font-black py-2">Equipe</TabsTrigger>
            <TabsTrigger value="equipamentos" className="rounded-lg text-[10px] uppercase font-black py-2">Máquinas</TabsTrigger>
            <TabsTrigger value="materiais" className="rounded-lg text-[10px] uppercase font-black py-2">Materiais</TabsTrigger>
            <TabsTrigger value="seguranca" className="rounded-lg text-[10px] uppercase font-black py-2">Segurança</TabsTrigger>
            <TabsTrigger value="ocorrencias" className="rounded-lg text-[10px] uppercase font-black py-2">Ocorrências</TabsTrigger>
          </TabsList>
          
          <TabsContent value="atividades" className="pt-4"><RdoActivitiesForm obraId={obraId} /></TabsContent>
          <TabsContent value="mao_de_obra" className="pt-4"><RdoManpowerForm /></TabsContent>
          <TabsContent value="equipamentos" className="pt-4"><RdoEquipmentForm /></TabsContent>
          <TabsContent value="materiais" className="pt-4"><RdoMaterialsForm /></TabsContent>
          <TabsContent value="seguranca" className="pt-4"><div className="p-4 text-center text-muted-foreground">Checklist de Segurança</div></TabsContent>
          <TabsContent value="ocorrencias" className="pt-4 space-y-6">
            <FormField control={methods.control} name="impedimentos_comentarios" render={({ field }) => (
                <FormItem>
                    <FormLabel className="flex items-center gap-2 text-destructive font-black uppercase text-xs tracking-widest">
                        <AlertOctagon className="w-4 h-4" /> 
                        Causas de Paralisação / Impedimentos
                    </FormLabel>
                    <FormControl>
                        <Textarea 
                            placeholder="Descreva problemas que travaram a obra (ex: Falta de energia, Greve, Chuva torrencial...)" 
                            {...field} 
                            value={field.value || ""} 
                            rows={4} 
                            className="bg-red-50/30 border-red-100"
                        />
                    </FormControl>
                </FormItem>
            )} />

            <FormField control={methods.control} name="observacoes_gerais" render={({ field }) => (
                <FormItem>
                    <FormLabel className="flex items-center gap-2 text-primary font-black uppercase text-xs tracking-widest">
                        <MessageSquare className="w-4 h-4" /> 
                        Observações Gerais do Dia
                    </FormLabel>
                    <FormControl>
                        <Textarea 
                            placeholder="Notas diversas (ex: Sumiço de materiais, visita de fiscalização, entrega de documentos...)" 
                            {...field} 
                            value={field.value || ""} 
                            rows={4} 
                            className="bg-blue-50/30 border-blue-100"
                        />
                    </FormControl>
                </FormItem>
            )} />
          </TabsContent>
        </Tabs>
        
        <div className="pt-6 border-t">
            {isPro ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <RdoSignaturePad diarioId={initialData?.id || 'new'} obraId={obraId} currentSignatureUrl={methods.watch('responsible_signature_url') || null} onSignatureSave={(url) => methods.setValue('responsible_signature_url', url, { shouldDirty: true })} />
                    <RdoSignaturePad diarioId={initialData?.id || 'new-client'} obraId={obraId} currentSignatureUrl={methods.watch('client_signature_url') || null} onSignatureSave={(url) => methods.setValue('client_signature_url', url, { shouldDirty: true })} />
                </div>
            ) : (
                <div className="p-8 text-center bg-muted/20 rounded-3xl border-dashed border-2 cursor-pointer" onClick={() => setShowUpgrade(true)}>
                    <Lock className="w-8 h-8 mx-auto mb-2 text-muted-foreground/30" />
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Assinaturas Digitais Exclusivas PRO</p>
                </div>
            )}
        </div>
      </form>
    </FormProvider>
  );
};

export default RdoForm;