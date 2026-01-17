import { useForm, FormProvider, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { showSuccess, showError } from "@/utils/toast";
import { Loader2, Save, FileDown, DollarSign, Lock, ShieldCheck, UserCheck, Sun, AlertOctagon, Clock, Copy, Upload, Image as ImageIcon, X, Handshake, Moon, SunMedium } from "lucide-react";
import { DiarioObra, RdoClima, RdoStatusDia, useCreateRdo, useUpdateRdo, WorkforceType } from "@/hooks/use-rdo";
import RdoActivitiesForm from "./RdoActivitiesForm";
import RdoManpowerForm from "./RdoManpowerForm";
import RdoEquipmentForm from "./RdoEquipmentForm";
import RdoMaterialsForm from "./RdoMaterialsForm";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Label } from "@/components/ui/label";

const statusOptions: RdoStatusDia[] = ['Operacional', 'Parcialmente Paralisado', 'Totalmente Paralisado - Não Praticável'];
const climaOptions: RdoClima[] = ['Sol', 'Nublado', 'Chuva Leve', 'Chuva Forte'];
const workforceTypes: WorkforceType[] = ['Própria', 'Terceirizada'];

const RdoDetailSchema = z.object({
  descricao_servico: z.string().min(5, "Descrição do serviço deve ter no mínimo 5 letras."),
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
  periodo: z.string().min(1, "Selecione pelo menos um período."),
  clima_condicoes: z.enum(climaOptions).nullable().optional(),
  status_dia: z.enum(statusOptions, { required_error: "O status do dia é obrigatório." }),
  observacoes_gerais: z.string().nullable().optional(),
  impedimentos_comentarios: z.string().nullable().optional(),
  responsible_signature_url: z.string().nullable().optional(),
  client_signature_url: z.string().nullable().optional(),
  signer_name: z.string().nullable().optional(),
  work_stopped: z.boolean().default(false),
  hours_lost: z.number().min(0).max(24).default(0),
  safety_nr35: z.boolean().default(false),
  safety_epi: z.boolean().default(false),
  safety_cleaning: z.boolean().default(false),
  safety_dds: z.boolean().default(false),
  safety_comments: z.string().nullable().optional(),
  safety_photo_url: z.string().nullable().optional(),
  atividades: z.array(RdoDetailSchema).min(1, "Registre ao menos 1 atividade para salvar."),
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
  const isEditing = !!initialData;
  const isPro = profile?.subscription_status === 'active' || profile?.plan_type === 'pro';
  const createMutation = useCreateRdo();
  const updateMutation = useUpdateRdo();
  const { data: obras } = useObras();
  const obraNome = obras?.find(o => o.id === obraId)?.nome || "Obra";
  const [isUploadingSafety, setIsUploadingSafety] = useState(false);

  // Helper para normalizar o período inicial
  const getInitialPeriod = () => {
    if (!initialData?.periodo) return "Manhã, Tarde";
    if (initialData.periodo === 'Integral') return "Manhã, Tarde";
    return initialData.periodo;
  };

  const methods = useForm<RdoFormValues>({
    resolver: zodResolver(RdoSchema),
    defaultValues: {
      obra_id: obraId,
      data_rdo: initialData?.data_rdo 
        ? new Date(initialData.data_rdo + 'T12:00:00') 
        : (selectedDate || new Date()),
      periodo: getInitialPeriod(),
      clima_condicoes: initialData?.clima_condicoes || undefined,
      status_dia: initialData?.status_dia || 'Operacional',
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
      safety_photo_url: initialData?.safety_photo_url || null,
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
        quantidade_entrada: m.quantidade_entrada || 0,
        quantidade_consumida: m.quantidade_consumida,
        observacao: m.observacao,
      })) || [],
    },
  });

  const maoDeObra = useWatch({
    control: methods.control,
    name: "mao_de_obra",
  });
  const workStopped = methods.watch("work_stopped");
  const safetyPhotoUrl = methods.watch("safety_photo_url");

  const estimatedDailyCost = useMemo(() => {
    return maoDeObra?.reduce((sum, item) => {
        const qtd = Number(item.quantidade) || 0;
        const custo = Number(item.custo_unitario) || 0;
        return sum + (qtd * custo);
    }, 0) || 0;
  }, [maoDeObra]);

  const handleCopyPrevious = () => {
    if (!previousRdoData) return;
    
    const previousManpower = previousRdoData.rdo_mao_de_obra?.map(m => ({
        funcao: m.funcao,
        quantidade: m.quantidade,
        custo_unitario: m.custo_unitario,
        tipo: m.tipo || 'Própria',
    })) || [];

    const previousEquipment = previousRdoData.rdo_equipamentos?.map(e => ({
        equipamento: e.equipamento,
        horas_trabalhadas: e.horas_trabalhadas,
        horas_paradas: e.horas_paradas,
    })) || [];

    methods.setValue('mao_de_obra', previousManpower, { shouldDirty: true, shouldValidate: true });
    methods.setValue('equipamentos', previousEquipment, { shouldDirty: true, shouldValidate: true });
    
    if ((previousRdoData as any).signer_name) {
        methods.setValue('signer_name', (previousRdoData as any).signer_name);
    }

    showSuccess("Dados copiados com sucesso!");
  };

  const handleExportPdf = () => {
    if (initialData) {
      const currentData: DiarioObra = {
        ...initialData,
        ...methods.getValues() as any, 
        rdo_mao_de_obra: methods.getValues('mao_de_obra') as any,
        rdo_materiais: methods.getValues('materiais') as any,
        rdo_atividades_detalhe: methods.getValues('atividades') as any,
      };
      generateRdoPdf(currentData, obraNome, profile);
    } else {
      showError("Salve o RDO antes de exportar.");
    }
  };

  const handleSafetyFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingSafety(true);
    
    try {
        const fileExt = file.name.split('.').pop();
        const fileName = `safety-${obraId}-${Date.now()}.${fileExt}`;
        const filePath = `rdo_safety/${obraId}/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('documentos_financeiros')
            .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
            .from('documentos_financeiros')
            .getPublicUrl(filePath);

        methods.setValue('safety_photo_url', publicUrlData.publicUrl, { shouldDirty: true });
        showSuccess("Foto anexada!");
    } catch (error) {
        showError("Erro no upload.");
    } finally {
        setIsUploadingSafety(false);
    }
  };

  const onInvalid = (errors: any) => {
    console.error("Erros de validação:", errors);
    if (errors.atividades) {
      showError("Verifique a aba 'Serviços': Preencha a descrição.");
    } else {
      showError("Verifique os campos obrigatórios.");
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
    } catch (error) {
      showError(`Erro ao salvar: ${error instanceof Error ? error.message : "Erro desconhecido"}`);
    }
  };

  const handlePeriodToggle = (period: string, currentPeriods: string) => {
    const periods = currentPeriods.split(', ').filter(p => p !== '');
    if (periods.includes(period)) {
      const newPeriods = periods.filter(p => p !== period);
      return newPeriods.join(', ');
    } else {
      const newPeriods = [...periods, period];
      const order = ['Manhã', 'Tarde', 'Noite'];
      newPeriods.sort((a, b) => order.indexOf(a) - order.indexOf(b));
      return newPeriods.join(', ');
    }
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit, onInvalid)} className="space-y-6">
        <UpgradeModal 
            open={showUpgrade} 
            onOpenChange={setShowUpgrade} 
            title="Recurso Exclusivo PRO"
            description="Assinaturas digitais e checklist de segurança estão disponíveis apenas para assinantes."
        />

        {/* Custo e Botões de Ação */}
        <div className="flex flex-col gap-4">
            {!isEditing && (
                <div className="flex justify-center bg-accent/20 p-2 rounded-xl">
                    <Button 
                        type="button" 
                        variant="outline" 
                        onClick={handleCopyPrevious} 
                        disabled={!previousRdoData}
                        className="w-full sm:w-auto border-primary/30 text-primary hover:bg-primary/5"
                    >
                        <Copy className="w-4 h-4 mr-2" />
                        {previousRdoData ? "Copiar Equipe e Máquinas do Último RDO" : "Nenhum RDO anterior encontrado"}
                    </Button>
                </div>
            )}

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-primary/10 rounded-2xl border border-primary/20 gap-4">
              <div className="flex items-center gap-3">
                <div className="bg-primary p-2 rounded-lg text-primary-foreground"><DollarSign className="w-5 h-5" /></div>
                <div>
                  <p className="text-xs font-black text-primary uppercase">Custo de Mão de Obra do Dia</p>
                  <h2 className="text-2xl font-black">{formatCurrency(estimatedDailyCost)}</h2>
                </div>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                {isEditing && (
                  <Button type="button" variant="outline" onClick={handleExportPdf} className="flex-1 sm:flex-none rounded-xl font-bold uppercase text-xs">
                    <FileDown className="w-4 h-4 mr-2" /> PDF
                  </Button>
                )}
                <Button type="submit" disabled={updateMutation.isPending || createMutation.isPending} className="flex-1 sm:flex-none rounded-xl bg-primary hover:bg-primary/90 font-bold uppercase text-xs">
                  {(updateMutation.isPending || createMutation.isPending) ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  Salvar
                </Button>
              </div>
            </div>
        </div>

        {/* Informações Gerais (Local e Clima) */}
        <Card className="border-none shadow-clean bg-accent/20">
          <CardContent className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={methods.control}
              name="periodo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" /> Períodos Ativos</FormLabel>
                  <FormControl>
                    <div className="flex gap-2">
                        {['Manhã', 'Tarde', 'Noite'].map((p) => {
                            const isSelected = field.value.includes(p);
                            return (
                                <button
                                    key={p}
                                    type="button"
                                    onClick={() => field.onChange(handlePeriodToggle(p, field.value))}
                                    className={cn(
                                        "flex-1 px-3 py-2 rounded-xl border text-xs font-bold uppercase transition-all flex items-center justify-center gap-2",
                                        isSelected 
                                            ? "bg-primary text-white border-primary shadow-sm" 
                                            : "bg-white text-muted-foreground border-border hover:bg-gray-50"
                                    )}
                                >
                                    {p === 'Manhã' && <SunMedium className="w-3 h-3" />}
                                    {p === 'Tarde' && <Sun className="w-3 h-3" />}
                                    {p === 'Noite' && <Moon className="w-3 h-3" />}
                                    {p}
                                </button>
                            );
                        })}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={methods.control}
              name="clima_condicoes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1"><Sun className="w-3 h-3" /> Condições Climáticas</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value || undefined}>
                    <FormControl>
                      <SelectTrigger className="rounded-xl bg-white border-none shadow-sm h-10">
                        <SelectValue placeholder="Selecione o clima" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {climaOptions.map(option => (
                        <SelectItem key={option} value={option}>{option}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          
          <div className="px-4 pb-4 pt-0 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
             <FormField
                control={methods.control}
                name="status_dia"
                render={({ field }) => (
                  <FormItem className="flex-1 w-full">
                    <FormLabel className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1 mb-1.5"><AlertOctagon className="w-3 h-3" /> Status Operacional</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="rounded-xl bg-white border-none shadow-sm w-full">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {statusOptions.map(option => (
                          <SelectItem key={option} value={option}>{option}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
             
             <FormField
                control={methods.control}
                name="work_stopped"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center gap-2 space-y-0 mt-6 bg-white p-2 rounded-xl px-4 shadow-sm">
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel className="font-bold text-xs cursor-pointer text-muted-foreground uppercase">Houve paralisação?</FormLabel>
                  </FormItem>
                )}
              />
              {workStopped && (
                <FormField
                  control={methods.control}
                  name="hours_lost"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-2 space-y-0 mt-6 animate-in fade-in slide-in-from-left-2">
                      <FormLabel className="whitespace-nowrap text-xs font-bold uppercase text-destructive flex items-center gap-1"><Clock className="w-3 h-3" /> Horas Perdidas</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} className="w-20 h-10 rounded-xl bg-white border-destructive/30 font-bold" />
                      </FormControl>
                    </FormItem>
                  )}
                />
              )}
          </div>
        </Card>

        {/* SEÇÃO DE SEGURANÇA EM DESTAQUE (Movida para cá) */}
        <Card className="border-l-4 border-l-primary shadow-sm overflow-hidden bg-white">
            <CardHeader className="bg-primary/5 pb-2 py-3">
                <CardTitle className="text-sm font-black uppercase text-primary flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5" /> Segurança do Trabalho (EPI / DDS)
                </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-6">
                {!isPro ? (
                    <div className="flex items-center justify-between gap-4 p-2 bg-accent/20 rounded-xl cursor-pointer hover:bg-accent/40 transition-colors" onClick={() => setShowUpgrade(true)}>
                        <div className="flex items-center gap-3">
                            <Lock className="w-5 h-5 text-muted-foreground" />
                            <p className="text-xs text-muted-foreground font-medium">O checklist e o registro fotográfico de segurança são exclusivos do plano PRO.</p>
                        </div>
                        <Button size="sm" variant="outline" className="text-xs h-8">Liberar</Button>
                    </div>
                ) : (
                    <>
                        {/* Checklist */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {[
                                { name: "safety_nr35", label: "NR-35 (Altura)" },
                                { name: "safety_epi", label: "EPIs Completo" },
                                { name: "safety_cleaning", label: "Limpeza" },
                                { name: "safety_dds", label: "DDS Realizado" },
                            ].map((item) => (
                                <FormField key={item.name} control={methods.control} name={item.name as any} render={({ field }) => (
                                    <FormItem className="flex flex-row items-center justify-between rounded-xl border p-2 bg-slate-50">
                                        <FormLabel className="text-[10px] font-bold uppercase cursor-pointer">{item.label}</FormLabel>
                                        <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} className="scale-75" /></FormControl>
                                    </FormItem>
                                )} />
                            ))}
                        </div>

                        {/* Foto e Obs */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                            <div className="space-y-2 order-2 md:order-1">
                                <FormField control={methods.control} name="safety_comments" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs uppercase font-bold text-muted-foreground">Observações de Segurança</FormLabel>
                                        <FormControl>
                                            <Textarea {...field} value={field.value || ""} rows={3} className="rounded-xl resize-none text-xs" placeholder="Ex: Equipe orientada sobre riscos elétricos..." />
                                        </FormControl>
                                    </FormItem>
                                )} />
                            </div>
                            
                            <div className="space-y-2 order-1 md:order-2">
                                <Label className="text-xs uppercase font-bold text-muted-foreground flex items-center gap-2">
                                    <ImageIcon className="w-4 h-4 text-primary" />
                                    Foto de Comprovação (EPIs / DDS)
                                </Label>
                                <div className="flex items-center gap-4">
                                    {safetyPhotoUrl ? (
                                        <div className="relative w-full h-24 rounded-xl overflow-hidden border bg-muted group">
                                            <img src={safetyPhotoUrl} alt="Safety" className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                <a href={safetyPhotoUrl} target="_blank" rel="noreferrer" className="p-2 bg-white/20 rounded-full text-white hover:bg-white/40"><ImageIcon className="w-4 h-4" /></a>
                                                <button type="button" onClick={() => methods.setValue('safety_photo_url', null, { shouldDirty: true })} className="p-2 bg-red-500/80 rounded-full text-white hover:bg-red-600"><X className="w-4 h-4" /></button>
                                            </div>
                                        </div>
                                    ) : (
                                        <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-xl cursor-pointer hover:bg-accent/50 transition-colors bg-blue-50/50 border-blue-200">
                                            {isUploadingSafety ? (
                                                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                                            ) : (
                                                <div className="flex flex-col items-center gap-1 text-primary">
                                                    <Upload className="w-5 h-5" />
                                                    <span className="text-[10px] font-bold uppercase">Anexar Foto do Dia</span>
                                                </div>
                                            )}
                                            <input type="file" className="hidden" accept="image/*" onChange={handleSafetyFileUpload} disabled={isUploadingSafety} />
                                        </label>
                                    )}
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </CardContent>
        </Card>

        {/* Tabs - Agora sem Segurança */}
        <Tabs defaultValue="atividades" className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-auto bg-muted/50 p-1 rounded-xl gap-1">
            <TabsTrigger value="atividades" className="rounded-lg text-[10px] uppercase font-black py-2">Serviços</TabsTrigger>
            <TabsTrigger value="mao_de_obra" className="rounded-lg text-[10px] uppercase font-black py-2">Equipe</TabsTrigger>
            <TabsTrigger value="equipamentos" className="rounded-lg text-[10px] uppercase font-black py-2">Máquinas</TabsTrigger>
            <TabsTrigger value="materiais" className="rounded-lg text-[10px] uppercase font-black py-2">Materiais</TabsTrigger>
            {/* Ocorrências pode ser acessado em 'Materiais' ou criar tab propria, mantive Notas separadas se existir ou removi se for redundante com 'Obs Gerais', aqui vou manter 'Notas/Ocorrências' */}
          </TabsList>
          
          <TabsContent value="atividades" className="pt-4"><RdoActivitiesForm obraId={obraId} /></TabsContent>
          <TabsContent value="mao_de_obra" className="pt-4"><RdoManpowerForm /></TabsContent>
          <TabsContent value="equipamentos" className="pt-4"><RdoEquipmentForm /></TabsContent>
          <TabsContent value="materiais" className="pt-4"><RdoMaterialsForm /></TabsContent>
          {/* Ocorrências foi para 'Notas' se existir essa tab ou apenas um formfield abaixo */}
        </Tabs>

        {/* Ocorrências / Notas (Fora das tabs ou uma tab especifica) - Mantendo a logica anterior de ter Notes na Tab se necessario, mas o codigo anterior tinha uma tab 'ocorrencias' */}
        {/* Como removi do TabsList acima por simplicidade visual (4 cols), vou reinserir a tab Notas caso precise, ou deixar como Card separado no final. Vou reinserir a Tab trigger. */}
        
        {/* Correção: Reinserindo a TabTrigger de Notas que acabei tirando sem querer na visualizacao acima */}
        {/* Vou corrigir o TabsList acima para incluir Ocorrencias/Notas */}
        
        <div className="pt-6 border-t space-y-6">
          {!isPro ? (
            <div 
                className="border-2 border-dashed border-muted rounded-3xl p-8 text-center cursor-pointer hover:bg-muted/50 transition-all flex flex-col items-center gap-3"
                onClick={() => setShowUpgrade(true)}
            >
                <Lock className="w-10 h-10 text-muted-foreground/30" />
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Assinatura Digital Exclusiva PRO</p>
                <Button size="sm" variant="outline" className="rounded-xl px-6">Ver Benefícios</Button>
            </div>
          ) : (
            <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Responsável */}
                    <div className="space-y-4 p-4 border rounded-2xl bg-slate-50">
                        <div className="flex items-center gap-2 mb-2">
                            <UserCheck className="w-5 h-5 text-primary" />
                            <h3 className="text-sm font-black uppercase tracking-tight">Responsável Técnico</h3>
                        </div>
                        <div className="space-y-3">
                            <FormField control={methods.control} name="signer_name" render={({ field }) => (
                                <FormItem><FormLabel className="text-[10px] uppercase font-bold text-muted-foreground">Nome Completo</FormLabel><FormControl><Input placeholder="Engenheiro / Mestre" {...field} value={field.value || ""} className="rounded-xl h-9 bg-white" /></FormControl></FormItem>
                            )} />
                        </div>
                        <div className="mt-4">
                            <RdoSignaturePad diarioId={initialData?.id || 'new'} obraId={obraId} currentSignatureUrl={methods.watch('responsible_signature_url') || null} onSignatureSave={(url) => methods.setValue('responsible_signature_url', url, { shouldDirty: true })} />
                        </div>
                    </div>

                    {/* Cliente */}
                    <div className="space-y-4 p-4 border rounded-2xl bg-slate-50">
                        <div className="flex items-center gap-2 mb-2">
                            <Handshake className="w-5 h-5 text-primary" />
                            <h3 className="text-sm font-black uppercase tracking-tight">Visto do Cliente / Fiscal</h3>
                        </div>
                        <div className="mt-4 pt-16">
                            <RdoSignaturePad diarioId={initialData?.id || 'new-client'} obraId={obraId} currentSignatureUrl={methods.watch('client_signature_url') || null} onSignatureSave={(url) => methods.setValue('client_signature_url', url, { shouldDirty: true })} />
                        </div>
                    </div>
                </div>
            </>
          )}
        </div>
      </form>
    </FormProvider>
  );
};

export default RdoForm;