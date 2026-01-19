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
import { Loader2, Save, FileDown, DollarSign, Lock, ShieldCheck, Sun, Clock, Upload, Image as ImageIcon, X, MessageSquare, AlertOctagon, Cloud, CloudRain, CloudLightning, CheckCircle2, AlertCircle, Moon, Power, SunMedium } from "lucide-react";
import { DiarioObra, useCreateRdo, useUpdateRdo, WorkforceType, useRdoList } from "@/hooks/use-rdo";
import RdoActivitiesForm from "./RdoActivitiesForm";
import RdoManpowerForm from "./RdoManpowerForm";
import RdoEquipmentForm from "./RdoEquipmentForm";
import RdoMaterialsForm from "./RdoMaterialsForm";
import RdoSafetyForm from "./RdoSafetyForm";
import RdoSignaturePad from "./RdoSignaturePad";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMemo, useState } from "react";
import { formatCurrency } from "@/utils/formatters";
import { generateRdoPdf } from "@/utils/rdo-pdf";
import { useObras } from "@/hooks/use-obras";
import { useAuth } from "@/integrations/supabase/auth-provider";
import UpgradeModal from "../subscription/UpgradeModal";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";

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
  custo_unitario: z.coerce.number().min(0),
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
  periodo: z.string().default("Integral"),
  clima_condicoes: z.string().nullable().optional(),
  status_dia: z.string().optional(), 
  observacoes_gerais: z.string().nullable().optional(),
  impedimentos_comentarios: z.string().nullable().optional(),
  responsible_signature_url: z.string().nullable().optional(),
  client_signature_url: z.string().nullable().optional(),
  signer_name: z.string().nullable().optional(),
  work_stopped: z.boolean().default(false),
  hours_lost: z.coerce.number().min(0).max(24).default(0),
  
  morning_enabled: z.boolean().default(true),
  morning_clima: z.string().default("Sol"),
  morning_status: z.string().default("Operacional"),
  
  afternoon_enabled: z.boolean().default(true),
  afternoon_clima: z.string().default("Sol"),
  afternoon_status: z.string().default("Operacional"),
  
  night_enabled: z.boolean().default(false),
  night_clima: z.string().default("Sol"),
  night_status: z.string().default("Operacional"),

  safety_nr35: z.boolean().default(false),
  safety_epi: z.boolean().default(false),
  safety_cleaning: z.boolean().default(false),
  safety_dds: z.boolean().default(false),
  safety_comments: z.string().nullable().optional(),
  
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

  const parseSavedClima = (data: string | null) => {
    if (!data) return { m: "Sol", ms: "Operacional", me: true, a: "Sol", as: "Operacional", ae: true, n: "Sol", ns: "Operacional", ne: false };
    const parts = data.split(', ');
    const getVal = (idx: number) => {
        if (!parts[idx] || parts[idx].includes("N/T")) return { c: "Sol", s: "Operacional", e: false };
        const match = parts[idx].match(/: (.*?) \((.*?)\)/);
        return match ? { c: match[1], s: match[2] === "Op" ? "Operacional" : "Paralisado", e: true } : { c: "Sol", s: "Operacional", e: false };
    };
    const m = getVal(0); const a = getVal(1); const n = getVal(2);
    return { 
        m: m.c, ms: m.s, me: m.e, 
        a: a.c, as: a.s, ae: a.e, 
        n: n.c, ns: n.s, ne: n.e 
    };
  };

  const savedPeriods = parseSavedClima(initialData?.clima_condicoes || null);

  const methods = useForm<RdoFormValues>({
    resolver: zodResolver(RdoSchema),
    defaultValues: {
      obra_id: obraId,
      data_rdo: initialData?.data_rdo ? new Date(initialData.data_rdo + 'T12:00:00') : (selectedDate || new Date()),
      morning_enabled: savedPeriods.me,
      morning_clima: savedPeriods.m,
      morning_status: savedPeriods.ms,
      afternoon_enabled: savedPeriods.ae,
      afternoon_clima: savedPeriods.a,
      afternoon_status: savedPeriods.as,
      night_enabled: savedPeriods.ne,
      night_clima: savedPeriods.n,
      night_status: savedPeriods.ns,
      status_dia: initialData?.status_dia || 'Operacional',
      observacoes_gerais: initialData?.observacoes_gerais || "",
      impedimentos_comentarios: initialData?.impedimentos_comentarios || "",
      responsible_signature_url: initialData?.responsible_signature_url || null,
      client_signature_url: initialData?.client_signature_url || null,
      signer_name: (initialData as any)?.signer_name || `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim(),
      
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

  const estimatedDailyCost = useMemo(() => {
    const manpowerCost = maoDeObra?.reduce((sum, item) => (sum + (Number(item.quantidade || 0) * Number(item.custo_unitario || 0))), 0) || 0;
    const equipmentCost = equipamentos?.reduce((sum, item) => (sum + (Number(item.horas_trabalhadas || 0) * Number(item.custo_hora || 0))), 0) || 0;
    return manpowerCost + equipmentCost;
  }, [maoDeObra, equipamentos]);

  const onSubmit = async (values: RdoFormValues) => {
    try {
      const getP = (en: boolean, c: string, s: string, prefix: string) => 
        en ? `${prefix}: ${c} (${s === "Operacional" ? "Op" : "Par"})` : `${prefix}: N/T`;

      const climaString = `${getP(values.morning_enabled, values.morning_clima, values.morning_status, "M")}, ${getP(values.afternoon_enabled, values.afternoon_clima, values.afternoon_status, "T")}, ${getP(values.night_enabled, values.night_clima, values.night_status, "N")}`;
      
      // Separamos os campos de UI (que não existem no banco) dos dados de banco
      const {
        morning_enabled, morning_clima, morning_status,
        afternoon_enabled, afternoon_clima, afternoon_status,
        night_enabled, night_clima, night_status,
        ...databaseValues
      } = values;

      const dataToSubmit = {
        ...databaseValues,
        data_rdo: format(values.data_rdo, 'yyyy-MM-dd'),
        clima_condicoes: climaString,
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
      console.error("Erro ao salvar RDO:", error);
      showError(error.message || "Falha ao salvar.");
    }
  };

  const PeriodBox = ({ label, enabledName, climaName, statusName, icon: Icon }: { label: string, enabledName: any, climaName: any, statusName: any, icon: any }) => {
    const isEnabled = useWatch({ control: methods.control, name: enabledName });

    return (
        <div className={cn("p-4 border rounded-2xl bg-card shadow-sm space-y-3 transition-all", !isEnabled && "opacity-40 grayscale-[0.5] bg-muted/50")}>
            <div className="flex items-center justify-between border-b pb-2">
                <div className="flex items-center gap-2">
                    <Icon className={cn("w-4 h-4", isEnabled ? "text-primary" : "text-muted-foreground")} />
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{label}</span>
                </div>
                <FormField control={methods.control} name={enabledName} render={({ field }) => (
                    <Switch checked={field.value} onCheckedChange={field.onChange} className="scale-75 h-4" />
                )} />
            </div>
            
            <div className={cn("space-y-2", !isEnabled && "pointer-events-none")}>
                <FormField control={methods.control} name={climaName} render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!isEnabled}>
                        <FormControl><SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                            <SelectItem value="Sol">☀️ Sol</SelectItem>
                            <SelectItem value="Nublado">☁️ Nublado</SelectItem>
                            <SelectItem value="Chuva Leve">🌦️ Chuva Leve</SelectItem>
                            <SelectItem value="Chuva Forte">⛈️ Chuva Forte</SelectItem>
                        </SelectContent>
                    </Select>
                )} />
                <FormField control={methods.control} name={statusName} render={({ field }) => (
                    <div className="grid grid-cols-2 gap-1 bg-muted p-1 rounded-lg">
                        <button 
                            type="button"
                            onClick={() => field.onChange("Operacional")}
                            className={cn("text-[9px] font-black uppercase py-1.5 rounded-md transition-all", field.value === "Operacional" ? "bg-green-600 text-white shadow-sm" : "text-muted-foreground hover:bg-muted-foreground/10")}
                        >Op.</button>
                        <button 
                            type="button"
                            onClick={() => field.onChange("Paralisado")}
                            className={cn("text-[9px] font-black uppercase py-1.5 rounded-md transition-all", field.value === "Paralisado" ? "bg-destructive text-white shadow-sm" : "text-muted-foreground hover:bg-muted-foreground/10")}
                        >Par.</button>
                    </div>
                )} />
            </div>
        </div>
    );
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-6">
        <UpgradeModal open={showUpgrade} onOpenChange={setShowUpgrade} />

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-primary/10 rounded-2xl border border-primary/20 gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-primary p-2 rounded-lg text-primary-foreground"><DollarSign className="w-5 h-5" /></div>
            <div>
              <p className="text-xs font-black text-primary uppercase">Custo Estimado do Dia</p>
              <h2 className="text-2xl font-black">{formatCurrency(estimatedDailyCost)}</h2>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            {isEditing && (
              <Button type="button" variant="outline" onClick={() => generateRdoPdf(initialData, obraNome, profile, currentObra, rdoList)} disabled={isGeneratingPdf} className="flex-1 sm:flex-none rounded-xl font-bold uppercase text-xs">
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

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <PeriodBox label="Manhã" enabledName="morning_enabled" climaName="morning_clima" statusName="morning_status" icon={Sun} />
            <PeriodBox label="Tarde" enabledName="afternoon_enabled" climaName="afternoon_clima" statusName="afternoon_status" icon={Sun} />
            <PeriodBox label="Noite" enabledName="night_enabled" climaName="night_clima" statusName="night_status" icon={Moon} />
        </div>

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
          <TabsContent value="seguranca" className="pt-4"><RdoSafetyForm /></TabsContent>
          <TabsContent value="ocorrencias" className="pt-4 space-y-6">
            <FormField control={methods.control} name="impedimentos_comentarios" render={({ field }) => (
                <FormItem>
                    <FormLabel className="flex items-center gap-2 text-destructive font-black uppercase text-xs tracking-widest">
                        <AlertOctagon className="w-4 h-4" /> 
                        Causas de Paralisação / Impedimentos
                    </FormLabel>
                    <FormControl>
                        <Textarea 
                            placeholder="Descreva problemas que travaram a obra..." 
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
                            placeholder="Notas diversas..." 
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