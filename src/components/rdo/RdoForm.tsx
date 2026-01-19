"use client";

import { useForm, FormProvider, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { showSuccess, showError } from "@/utils/toast";
import { Loader2, Save, FileDown, DollarSign, Lock, Sun, Cloud, CloudRain, CloudLightning, CheckCircle2, AlertCircle, Send, Signature, Share2, Link2, Mail, Check, MessageSquare } from "lucide-react";
import { DiarioObra, useCreateRdo, useUpdateRdo, WorkforceType, useRdoList, useRequestRdoApproval } from "@/hooks/use-rdo";
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
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

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
  { value: "Sol", icon: Sun },
  { value: "Nublado", icon: Cloud },
  { value: "Chuva Leve", icon: CloudRain },
  { value: "Chuva Forte", icon: CloudLightning },
];

const statusStyles: Record<string, { bg: string, text: string, label: string, border: string }> = {
    'draft': { bg: 'bg-slate-100', text: 'text-slate-600', label: 'Rascunho', border: 'border-slate-200' },
    'pending': { bg: 'bg-orange-100', text: 'text-orange-600', label: 'Aguardando Cliente', border: 'border-orange-200' },
    'approved': { bg: 'bg-green-100', text: 'text-green-700', label: 'Aprovado ✅', border: 'border-green-300' },
    'rejected': { bg: 'bg-red-100', text: 'text-red-600', label: 'Correção Solicitada', border: 'border-red-200' },
};

const RdoForm = ({ obraId, initialData, onSuccess, previousRdoData, selectedDate }: RdoFormProps) => {
  const { profile } = useAuth();
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const isEditing = !!initialData;
  const currentStatus = initialData?.status || 'draft';
  const statusConfig = statusStyles[currentStatus];
  const isApproved = currentStatus === 'approved';
  
  const isPro = profile?.subscription_status === 'active' || profile?.plan_type === 'pro';
  const createMutation = useCreateRdo();
  const updateMutation = useUpdateRdo();
  const requestApprovalMutation = useRequestRdoApproval();
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

  const shareLink = useMemo(() => {
      if (!initialData?.approval_token) return "";
      return `${window.location.origin}/rdo/share/${initialData.approval_token}`;
  }, [initialData]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareLink);
    showSuccess("Link copiado para a área de transferência!");
  };

  const handleSendWhatsApp = async () => {
    if (!initialData) return;
    try {
        await requestApprovalMutation.mutateAsync({ id: initialData.id, obraId });
        const obraNome = obras?.find(o => o.id === obraId)?.nome || "Obra";
        const message = encodeURIComponent(`Olá! Segue o RDO da obra *${obraNome}* para sua conferência e assinatura digital:\n\n🔗 ${shareLink}`);
        window.open(`https://wa.me/?text=${message}`, '_blank');
        showSuccess("Solicitação enviada!");
    } catch (err) {
        showError("Erro ao processar solicitação.");
    }
  };

  const handleSendEmail = () => {
    const obraNome = obras?.find(o => o.id === obraId)?.nome || "Obra";
    const subject = encodeURIComponent(`Diário de Obra: ${obraNome} - ${initialData?.data_rdo}`);
    const body = encodeURIComponent(`Olá,\n\nSegue o link para visualização e assinatura digital do Diário de Obra:\n\n${shareLink}\n\nAtenciosamente,\nEquipe de Engenharia.`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

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

  const CompactPeriodRow = ({ label, enabledName, climaName, statusName }: { label: string, enabledName: any, climaName: any, statusName: any }) => {
    const isEnabled = useWatch({ control: methods.control, name: enabledName });
    const currentClima = methods.watch(climaName);
    const currentStatus = methods.watch(statusName);

    return (
        <div className={cn(
            "flex flex-col sm:flex-row sm:items-center justify-between py-4 border-b border-border last:border-0 transition-all",
            (!isEnabled || isApproved) && "opacity-40 grayscale pointer-events-none"
        )}>
            <div className="flex items-center justify-between sm:justify-start gap-4 mb-3 sm:mb-0 pointer-events-auto">
                <span className="text-sm font-bold text-foreground w-16">{label}</span>
                <FormField control={methods.control} name={enabledName} render={({ field }) => (
                    <Switch 
                        checked={field.value} 
                        onCheckedChange={field.onChange} 
                        className="data-[state=checked]:bg-primary h-5 w-9"
                        disabled={isApproved}
                    />
                )} />
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-6">
                <div className="flex gap-1.5 items-center bg-muted/30 p-1 rounded-xl">
                    {WEATHER_OPTIONS.map((opt) => (
                        <button 
                            key={opt.value}
                            type="button"
                            onClick={() => methods.setValue(climaName, opt.value, { shouldDirty: true })}
                            className={cn(
                                "w-8 h-8 flex items-center justify-center rounded-lg transition-all",
                                currentClima === opt.value 
                                    ? "bg-primary text-white shadow-sm scale-110" 
                                    : "text-muted-foreground hover:bg-muted/60"
                            )}
                            disabled={isApproved}
                        >
                            <opt.icon className="w-4 h-4" />
                        </button>
                    ))}
                </div>

                <div className="w-[1px] h-6 bg-border hidden sm:block" />

                <div className="flex bg-muted/40 p-1 rounded-xl border border-border/50 min-w-[140px]">
                    <button 
                        type="button"
                        onClick={() => methods.setValue(statusName, "Operacional", { shouldDirty: true })}
                        className={cn(
                            "flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg font-black text-[9px] uppercase tracking-wider transition-all",
                            currentStatus === "Operacional" ? "bg-green-600 text-white shadow-sm" : "text-muted-foreground hover:text-foreground"
                        )}
                        disabled={isApproved}
                    >
                        <CheckCircle2 className="w-3 h-3" /> Op.
                    </button>
                    <button 
                        type="button"
                        onClick={() => methods.setValue(statusName, "Paralisado", { shouldDirty: true })}
                        className={cn(
                            "flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg font-black text-[9px] uppercase tracking-wider transition-all",
                            currentStatus === "Paralisado" ? "bg-destructive text-white shadow-sm" : "text-muted-foreground hover:text-foreground"
                        )}
                        disabled={isApproved}
                    >
                        <AlertCircle className="w-3 h-3" /> Par.
                    </button>
                </div>
            </div>
        </div>
    );
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-6">
        <UpgradeModal open={showUpgrade} onOpenChange={setShowUpgrade} />

        {/* Header de Custo e Status */}
        <div className={cn("flex flex-col sm:flex-row justify-between items-start sm:items-center p-5 bg-card border rounded-3xl shadow-clean gap-4 border-l-8", statusConfig.border)}>
          <div className="flex items-center gap-4">
            <div className={cn("p-3 rounded-2xl", isApproved ? "bg-green-100" : "bg-primary/10")}>
                {isApproved ? <Check className="w-7 h-7 text-green-600" /> : <DollarSign className="w-7 h-7 text-primary" />}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                  <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Gasto Estimado (Dia)</p>
                  <Badge className={cn("text-[8px] font-black uppercase", statusConfig.bg, statusConfig.text)}>
                      {statusConfig.label}
                  </Badge>
              </div>
              <h2 className="text-3xl font-black tracking-tight text-foreground">{formatCurrency(estimatedDailyCost)}</h2>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            {/* NOVO MENU SHARE */}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button 
                        variant="outline" 
                        disabled={!isEditing}
                        className="flex-1 sm:flex-none rounded-xl h-12 font-bold uppercase text-[10px] tracking-widest border-slate-300"
                    >
                        {isApproved ? <CheckCircle2 className="w-4 h-4 mr-2 text-green-600" /> : <Share2 className="w-4 h-4 mr-2" />}
                        {isApproved ? "Ver Aprovação" : "Solicitar Aprovação"}
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 rounded-xl shadow-xl">
                    <DropdownMenuLabel className="text-[10px] font-black uppercase text-slate-400">Opções de Envio</DropdownMenuLabel>
                    <DropdownMenuItem onClick={handleSendWhatsApp} className="gap-2 cursor-pointer focus:bg-green-50 focus:text-green-700">
                        <MessageSquare className="w-4 h-4 text-green-500" /> 
                        <span className="font-bold">Enviar no WhatsApp</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleCopyLink} className="gap-2 cursor-pointer">
                        <Link2 className="w-4 h-4 text-slate-500" /> Copiar Link
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleSendEmail} className="gap-2 cursor-pointer">
                        <Mail className="w-4 h-4 text-slate-500" /> Abrir no E-mail
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <Button 
                type="button" 
                variant="outline" 
                onClick={() => generateRdoPdf(initialData!, obras?.find(o => o.id === obraId)?.nome || "Obra", profile, obras?.find(o => o.id === obraId), rdoList)} 
                disabled={isGeneratingPdf || !isEditing} 
                className="flex-1 sm:flex-none rounded-xl h-12 font-bold uppercase text-[10px] tracking-widest disabled:opacity-50"
            >
                <FileDown className="w-4 h-4 mr-2" /> PDF
            </Button>

            {isApproved ? (
                <div className="flex items-center justify-center bg-slate-100 text-slate-500 px-6 rounded-xl h-12 border font-black uppercase text-[10px] tracking-widest gap-2">
                    <Lock className="w-3 h-3" /> RDO Travado (Aprovado)
                </div>
            ) : (
                <Button type="submit" disabled={updateMutation.isPending || createMutation.isPending} className="flex-1 sm:flex-none rounded-xl bg-primary hover:bg-primary/90 h-12 font-bold uppercase text-[10px] tracking-widest shadow-lg shadow-primary/20">
                    {(updateMutation.isPending || createMutation.isPending) ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    Salvar Registro
                </Button>
            )}
          </div>
        </div>

        {/* Notificação de Rejeição */}
        {initialData?.status === 'rejected' && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 animate-in slide-in-from-top-2">
                <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                    <p className="text-xs font-black text-red-800 uppercase">Correção Solicitada pelo Cliente</p>
                    <p className="text-sm text-red-700 font-medium italic">"{initialData.rejection_reason}"</p>
                </div>
            </div>
        )}

        {/* Lista Compacta de Turnos */}
        <div className="bg-card border rounded-3xl p-5 space-y-1">
            <CompactPeriodRow label="Manhã" enabledName="morning_enabled" climaName="morning_clima" statusName="morning_status" />
            <CompactPeriodRow label="Tarde" enabledName="afternoon_enabled" climaName="afternoon_clima" statusName="afternoon_status" />
            <CompactPeriodRow label="Noite" enabledName="night_enabled" climaName="night_clima" statusName="night_status" />
        </div>

        <Tabs defaultValue="atividades" className="w-full">
          <TabsList className="grid w-full grid-cols-3 md:grid-cols-7 h-auto bg-muted/40 p-1 rounded-2xl gap-1 border">
            <TabsTrigger value="atividades" className="rounded-xl text-[9px] uppercase font-black py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm">Serviços</TabsTrigger>
            <TabsTrigger value="mao_de_obra" className="rounded-xl text-[9px] uppercase font-black py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm">Equipe</TabsTrigger>
            <TabsTrigger value="equipamentos" className="rounded-xl text-[9px] uppercase font-black py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm">Máquinas</TabsTrigger>
            <TabsTrigger value="materiais" className="rounded-xl text-[9px] uppercase font-black py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm">Materiais</TabsTrigger>
            <TabsTrigger value="seguranca" className="rounded-xl text-[9px] uppercase font-black py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm">Segurança</TabsTrigger>
            <TabsTrigger value="ocorrencias" className="rounded-xl text-[9px] uppercase font-black py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm">Ocorrências</TabsTrigger>
            <TabsTrigger value="assinaturas" className="rounded-xl text-[9px] uppercase font-black py-2.5 data-[state=active]:bg-[#066abc] data-[state=active]:text-white">Assinar</TabsTrigger>
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
                    <FormControl><Textarea {...field} value={field.value || ""} rows={4} className="bg-red-50/5 rounded-2xl border-red-100" placeholder="Descreva problemas técnicos, falta de material ou atrasos..." disabled={isApproved} /></FormControl>
                </FormItem>
            )} />
            <FormField control={methods.control} name="observacoes_gerais" render={({ field }) => (
                <FormItem>
                    <FormLabel className="text-[10px] font-black uppercase text-primary tracking-widest ml-2">Observações Gerais</FormLabel>
                    <FormControl><Textarea {...field} value={field.value || ""} rows={4} className="rounded-2xl" placeholder="Notas adicionais sobre o dia na obra..." disabled={isApproved} /></FormControl>
                </FormItem>
            )} />
          </TabsContent>
          <TabsContent value="assinaturas" className="pt-6">
            <div className="space-y-6">
                <div className="flex items-center gap-2 border-b pb-2 mb-4">
                    <Signature className="w-5 h-5 text-primary" />
                    <h3 className="text-lg font-bold uppercase tracking-tight">Coleta de Assinaturas Digitais</h3>
                </div>
                
                {isPro ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-muted-foreground ml-2">Assinatura do Engenheiro / Responsável</Label>
                            <RdoSignaturePad 
                                diarioId={initialData?.id || 'new'} 
                                obraId={obraId} 
                                currentSignatureUrl={methods.watch('responsible_signature_url') || null} 
                                onSignatureSave={(url) => methods.setValue('responsible_signature_url', url, { shouldDirty: true })} 
                                disabled={isApproved}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-muted-foreground ml-2">Assinatura do Cliente / Fiscal (Opcional no App)</Label>
                            <RdoSignaturePad 
                                diarioId={initialData?.id || 'new-client'} 
                                obraId={obraId} 
                                currentSignatureUrl={methods.watch('client_signature_url') || null} 
                                onSignatureSave={(url) => methods.setValue('client_signature_url', url, { shouldDirty: true })} 
                                disabled={isApproved}
                            />
                        </div>
                    </div>
                ) : (
                    <div className="p-10 text-center bg-muted/10 rounded-[2.5rem] border-dashed border-2 border-border cursor-pointer hover:bg-muted/20 transition-all group" onClick={() => setShowUpgrade(true)}>
                        <Lock className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30 group-hover:scale-110 transition-transform" />
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Assinaturas Digitais Exclusivas PRO</p>
                        <p className="text-xs text-muted-foreground mt-2">Clique aqui para desbloquear o Plano PRO.</p>
                    </div>
                )}
            </div>
          </TabsContent>
        </Tabs>
        
        <div className="pt-4 flex justify-center">
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">
                {isEditing ? "Edição de Registro Existente" : "Novo Registro em Rascunho"}
            </p>
        </div>
      </form>
    </FormProvider>
  );
};

export default RdoForm;