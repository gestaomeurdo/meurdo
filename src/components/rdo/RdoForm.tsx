"use client";

import { useForm, FormProvider, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { showSuccess, showError } from "@/utils/toast";
import { Loader2, Save, FileDown, DollarSign, Lock, Sun, Cloud, CloudRain, CloudLightning, CheckCircle2, AlertCircle, Moon, Zap, Clock } from "lucide-react";
import { DiarioObra, useCreateRdo, useUpdateRdo, WorkforceType, useRdoList } from "@/hooks/use-rdo";
import RdoActivitiesForm from "./RdoActivitiesForm";
import RdoManpowerForm from "./RdoManpowerForm";
import RdoEquipmentForm from "./RdoEquipmentForm";
import RdoMaterialsForm from "./RdoMaterialsForm";
import RdoSafetyForm from "./RdoSafetyForm";
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
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";

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

const WEATHER_OPTIONS = [
  { value: "Sol", icon: Sun, label: "Limpo" },
  { value: "Nublado", icon: Cloud, label: "Nublado" },
  { value: "Chuva Leve", icon: CloudRain, label: "Chuva" },
  { value: "Chuva Forte", icon: CloudLightning, label: "Raios" },
];

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

  const methods = useForm<RdoFormValues>({
    resolver: zodResolver(RdoSchema),
  });

  const parseSavedClima = (data: string | null) => {
    const def = { 
        me: true, m: "Sol", ms: "Operacional", 
        ae: true, a: "Sol", as: "Operacional", 
        ne: false, n: "Sol", ns: "Operacional" 
    };
    
    if (!data) return def;

    const parts = data.split(', ');
    const getVal = (idx: number, prefix: string) => {
        const raw = parts[idx];
        if (!raw || raw.includes("N/T")) return { c: "Sol", s: "Operacional", e: false };

        const climaMatch = raw.match(/:\s*([^(\n,]*)/);
        const statusMatch = raw.match(/\((.*?)\)/);

        const clima = climaMatch ? climaMatch[1].trim() : "Sol";
        let status = "Operacional";
        
        if (statusMatch) {
            status = statusMatch[1] === "Op" ? "Operacional" : "Paralisado";
        }

        return { c: clima, s: status, e: true };
    };

    const m = getVal(0, "M"); 
    const a = getVal(1, "T"); 
    const n = getVal(2, "N");

    return { 
        me: m.e, m: m.c, ms: m.s, 
        ae: a.e, a: a.c, as: a.s, 
        ne: n.e, n: n.c, ns: n.s 
    };
  };

  useEffect(() => {
    const saved = parseSavedClima(initialData?.clima_condicoes || null);
    
    methods.reset({
      obra_id: obraId,
      data_rdo: initialData?.data_rdo ? new Date(initialData.data_rdo + 'T12:00:00') : (selectedDate || new Date()),
      morning_enabled: saved.me,
      morning_clima: saved.m,
      morning_status: saved.ms,
      afternoon_enabled: saved.ae,
      afternoon_clima: saved.a,
      afternoon_status: saved.as,
      night_enabled: saved.ne,
      night_clima: saved.n,
      night_status: saved.ns,
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
    });
  }, [initialData, obraId, profile, methods, selectedDate]);

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
      showError(error.message || "Falha ao salvar.");
    }
  };

  const PeriodCard = ({ label, enabledName, climaName, statusName, icon: Icon }: { label: string, enabledName: any, climaName: any, statusName: any, icon: any }) => {
    const isEnabled = useWatch({ control: methods.control, name: enabledName });

    return (
        <Card className={cn(
            "transition-all border shadow-sm rounded-2xl overflow-hidden", 
            !isEnabled && "opacity-60 bg-muted/40 grayscale"
        )}>
            <CardContent className="p-5 space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Icon className={cn("w-5 h-5", isEnabled ? "text-primary" : "text-muted-foreground")} />
                        <span className="text-sm font-bold text-foreground">{label}</span>
                    </div>
                    <FormField control={methods.control} name={enabledName} render={({ field }) => (
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                    )} />
                </div>
                
                {isEnabled && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-top-1 duration-300">
                        <div className="space-y-2">
                            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">Clima</span>
                            <div className="grid grid-cols-4 gap-1.5">
                                {WEATHER_OPTIONS.map((opt) => {
                                    const isSelected = methods.watch(climaName) === opt.value;
                                    return (
                                        <button 
                                            key={opt.value}
                                            type="button"
                                            onClick={() => methods.setValue(climaName, opt.value, { shouldDirty: true })}
                                            className={cn(
                                                "flex flex-col items-center justify-center py-3 rounded-xl border transition-all gap-1",
                                                isSelected ? "bg-primary border-primary text-white shadow-sm" : "bg-background border-border text-muted-foreground hover:bg-muted/50"
                                            )}
                                        >
                                            <opt.icon className="w-4 h-4" />
                                            <span className="text-[8px] font-bold uppercase">{opt.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">Status do Turno</span>
                            <div className="flex p-1 bg-muted/50 rounded-xl border border-border">
                                <button 
                                    type="button"
                                    onClick={() => methods.setValue(statusName, "Operacional", { shouldDirty: true })}
                                    className={cn(
                                        "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg font-bold text-[10px] uppercase transition-all",
                                        methods.watch(statusName) === "Operacional" ? "bg-white text-green-600 shadow-sm" : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    <CheckCircle2 className="w-3 h-3" /> Operacional
                                </button>
                                <button 
                                    type="button"
                                    onClick={() => methods.setValue(statusName, "Paralisado", { shouldDirty: true })}
                                    className={cn(
                                        "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg font-bold text-[10px] uppercase transition-all",
                                        methods.watch(statusName) === "Paralisado" ? "bg-white text-destructive shadow-sm" : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    <AlertCircle className="w-3 h-3" /> Paralisado
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                {!isEnabled && (
                    <div className="h-[148px] flex items-center justify-center border border-dashed rounded-xl">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Turno Inativo</span>
                    </div>
                )}
            </CardContent>
        </Card>
    );
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-6">
        <UpgradeModal open={showUpgrade} onOpenChange={setShowUpgrade} />

        {/* Header de Custo Estilo Dashboard */}
        <Card className="border-none shadow-clean bg-card overflow-hidden">
            <div className="h-1.5 w-full bg-primary"></div>
            <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                    <div className="flex items-center gap-4">
                        <div className="p-4 bg-primary/10 rounded-2xl">
                            <DollarSign className="w-8 h-8 text-primary" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Investimento em Equipe (Dia)</p>
                            <h2 className="text-4xl font-black tracking-tight text-foreground">{formatCurrency(estimatedDailyCost)}</h2>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                        {isEditing && (
                            <Button type="button" variant="outline" onClick={() => generateRdoPdf(initialData, obras?.find(o => o.id === obraId)?.nome || "Obra", profile, obras?.find(o => o.id === obraId), rdoList)} disabled={isGeneratingPdf} className="flex-1 sm:flex-none rounded-xl h-12 font-bold uppercase text-[10px] tracking-widest">
                                <FileDown className="w-4 h-4 mr-2" /> Exportar PDF
                            </Button>
                        )}
                        <Button type="submit" disabled={updateMutation.isPending || createMutation.isPending} className="flex-1 sm:flex-none rounded-xl bg-primary hover:bg-primary/90 h-12 font-bold uppercase text-[10px] tracking-widest shadow-lg shadow-primary/20">
                            {(updateMutation.isPending || createMutation.isPending) ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                            Salvar Diário
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <PeriodCard label="Manhã" enabledName="morning_enabled" climaName="morning_clima" statusName="morning_status" icon={Sun} />
            <PeriodCard label="Tarde" enabledName="afternoon_enabled" climaName="afternoon_clima" statusName="afternoon_status" icon={Clock} />
            <PeriodCard label="Noite" enabledName="night_enabled" climaName="night_clima" statusName="night_status" icon={Moon} />
        </div>

        <Tabs defaultValue="atividades" className="w-full">
          <TabsList className="grid w-full grid-cols-3 md:grid-cols-6 h-auto bg-muted/40 p-1 rounded-2xl gap-1 border">
            <TabsTrigger value="atividades" className="rounded-xl text-[9px] uppercase font-black py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm">Serviços</TabsTrigger>
            <TabsTrigger value="mao_de_obra" className="rounded-xl text-[9px] uppercase font-black py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm">Equipe</TabsTrigger>
            <TabsTrigger value="equipamentos" className="rounded-xl text-[9px] uppercase font-black py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm">Máquinas</TabsTrigger>
            <TabsTrigger value="materiais" className="rounded-xl text-[9px] uppercase font-black py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm">Materiais</TabsTrigger>
            <TabsTrigger value="seguranca" className="rounded-xl text-[9px] uppercase font-black py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm">Segurança</TabsTrigger>
            <TabsTrigger value="ocorrencias" className="rounded-xl text-[9px] uppercase font-black py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm">Ocorrências</TabsTrigger>
          </TabsList>
          
          <TabsContent value="atividades" className="pt-6"><RdoActivitiesForm obraId={obraId} /></TabsContent>
          <TabsContent value="mao_de_obra" className="pt-6"><RdoManpowerForm /></TabsContent>
          <TabsContent value="equipamentos" className="pt-6"><RdoEquipmentForm /></TabsContent>
          <TabsContent value="materiais" className="pt-6"><RdoMaterialsForm /></TabsContent>
          <TabsContent value="seguranca" className="pt-6"><RdoSafetyForm /></TabsContent>
          <TabsContent value="ocorrencias" className="pt-6 space-y-5">
            <FormField control={methods.control} name="impedimentos_comentarios" render={({ field }) => (
                <FormItem>
                    <FormLabel className="text-[10px] font-black uppercase text-destructive tracking-widest ml-2">Impedimentos e Paralisações</FormLabel>
                    <FormControl><Textarea {...field} value={field.value || ""} rows={4} className="bg-red-50/5 rounded-2xl border-red-100 focus:ring-destructive/20" placeholder="Descreva problemas técnicos, falta de material ou atrasos..." /></FormControl>
                </FormItem>
            )} />
            <FormField control={methods.control} name="observacoes_gerais" render={({ field }) => (
                <FormItem>
                    <FormLabel className="text-[10px] font-black uppercase text-primary tracking-widest ml-2">Observações Gerais</FormLabel>
                    <FormControl><Textarea {...field} value={field.value || ""} rows={4} className="rounded-2xl" placeholder="Notas adicionais sobre o dia na obra..." /></FormControl>
                </FormItem>
            )} />
          </TabsContent>
        </Tabs>
        
        <div className="pt-8 border-t border-dashed">
            {isPro ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <RdoSignaturePad diarioId={initialData?.id || 'new'} obraId={obraId} currentSignatureUrl={methods.watch('responsible_signature_url') || null} onSignatureSave={(url) => methods.setValue('responsible_signature_url', url, { shouldDirty: true })} />
                    <RdoSignaturePad diarioId={initialData?.id || 'new-client'} obraId={obraId} currentSignatureUrl={methods.watch('client_signature_url') || null} onSignatureSave={(url) => methods.setValue('client_signature_url', url, { shouldDirty: true })} />
                </div>
            ) : (
                <div className="p-10 text-center bg-muted/10 rounded-[2.5rem] border-dashed border-2 border-border cursor-pointer hover:bg-muted/20 transition-all group" onClick={() => setShowUpgrade(true)}>
                    <Lock className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30 group-hover:scale-110 transition-transform" />
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Assinaturas Digitais Exclusivas PRO</p>
                </div>
            )}
        </div>
      </form>
    </FormProvider>
  );
};

export default RdoForm;