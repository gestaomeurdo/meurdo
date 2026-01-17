import { useForm, FormProvider, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { showSuccess, showError } from "@/utils/toast";
import { Loader2, Save, FileDown, DollarSign, Lock, ShieldCheck, UserCheck, Sun, Clock, Copy, Upload, Image as ImageIcon, X, Handshake, Moon, SunMedium, CheckCircle } from "lucide-react";
import { DiarioObra, useCreateRdo, useUpdateRdo, WorkforceType, usePayRdo } from "@/hooks/use-rdo";
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

// Opções de status simplificadas
const statusOptions = ['Operacional', 'Não Praticável'];
const climaOptions = ['Sol', 'Nublado', 'Chuva Leve', 'Chuva Forte'];
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
  custo_hora: z.number().min(0).optional(),
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
  clima_condicoes: z.string().nullable().optional(),
  status_dia: z.string(), 
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
  
  safety_nr35_photo: z.string().nullable().optional(),
  safety_epi_photo: z.string().nullable().optional(),
  safety_cleaning_photo: z.string().nullable().optional(),
  safety_dds_photo: z.string().nullable().optional(),

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
  const payMutation = usePayRdo();
  const { data: obras } = useObras();
  const obraNome = obras?.find(o => o.id === obraId)?.nome || "Obra";
  
  const [uploadingState, setUploadingState] = useState<Record<string, boolean>>({});
  const [weatherMap, setWeatherMap] = useState<Record<string, string>>({});
  const [statusMap, setStatusMap] = useState<Record<string, string>>({});

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
        custo_hora: e.custo_hora || 0, // Load cost if available
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
  
  const equipamentos = useWatch({
    control: methods.control,
    name: "equipamentos",
  });

  const activePeriods = methods.watch("periodo");

  useEffect(() => {
    // Restaurar Clima
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
      } else {
        const map: Record<string, string> = {};
        ['Manhã', 'Tarde', 'Noite'].forEach(p => map[p] = weatherString);
        setWeatherMap(map);
      }
    }

    // Restaurar Status
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
        } else {
            const map: Record<string, string> = {};
            ['Manhã', 'Tarde', 'Noite'].forEach(p => map[p] = statusString);
            setStatusMap(map);
        }
    }
  }, [initialData]);

  // Atualizar campos hidden
  useEffect(() => {
    const selectedPeriods = activePeriods.split(', ').filter(p => p !== '');
    
    const weatherString = selectedPeriods
      .map(p => `${p}: ${weatherMap[p] || 'Sol'}`)
      .join(', ');
    methods.setValue('clima_condicoes', weatherString, { shouldDirty: true });

    const statusString = selectedPeriods
      .map(p => `${p}: ${statusMap[p] || 'Operacional'}`)
      .join(', ');
    methods.setValue('status_dia', statusString as any, { shouldDirty: true });

  }, [weatherMap, statusMap, activePeriods, methods]);

  const estimatedDailyCost = useMemo(() => {
    const manpowerCost = maoDeObra?.reduce((sum, item) => {
        const qtd = Number(item.quantidade) || 0;
        const custo = Number(item.custo_unitario) || 0;
        return sum + (qtd * custo);
    }, 0) || 0;

    const equipmentCost = equipamentos?.reduce((sum, item) => {
        const horas = Number(item.horas_trabalhadas) || 0;
        const custo = Number(item.custo_hora) || 0;
        return sum + (horas * custo);
    }, 0) || 0;

    return manpowerCost + equipmentCost;
  }, [maoDeObra, equipamentos]);

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
        custo_hora: e.custo_hora || 0,
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
        rdo_equipamentos: methods.getValues('equipamentos') as any,
      };
      generateRdoPdf(currentData, obraNome, profile);
    } else {
      showError("Salve o RDO antes de exportar.");
    }
  };

  const handlePayRdo = async () => {
    const manpower = methods.getValues('mao_de_obra') || [];
    const equipment = methods.getValues('equipamentos') || [];
    
    if (estimatedDailyCost <= 0) {
        showError("O custo total deve ser maior que zero.");
        return;
    }

    try {
        await payMutation.mutateAsync({
            obraId,
            rdoDate: format(methods.getValues('data_rdo'), 'yyyy-MM-dd'),
            totalCost: estimatedDailyCost,
            manpowerDetails: manpower.map(m => ({
                funcao: m.funcao,
                quantidade: m.quantidade,
                custo_unitario: m.custo_unitario || 0
            })),
            equipmentDetails: equipment.map(e => ({
                equipamento: e.equipamento,
                horas: e.horas_trabalhadas,
                custo_hora: e.custo_hora || 0
            }))
        });
        showSuccess("Pagamento enviado para o Financeiro!");
    } catch (error) {
        showError("Erro ao registrar pagamento.");
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>, fieldName: any) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingState(prev => ({ ...prev, [fieldName]: true }));
    
    try {
        const fileExt = file.name.split('.').pop();
        const fileName = `safety-${fieldName}-${obraId}-${Date.now()}.${fileExt}`;
        const filePath = `rdo_safety/${obraId}/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('documentos_financeiros')
            .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
            .from('documentos_financeiros')
            .getPublicUrl(filePath);

        methods.setValue(fieldName, publicUrlData.publicUrl, { shouldDirty: true });
        showSuccess("Foto anexada!");
    } catch (error) {
        showError("Erro no upload.");
    } finally {
        setUploadingState(prev => ({ ...prev, [fieldName]: false }));
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

  const activePeriodsList = activePeriods.split(', ').filter(p => p !== '');

  const safetyItems = [
    { key: "safety_nr35", label: "Treinamento / NR-35", photoKey: "safety_nr35_photo" },
    { key: "safety_epi", label: "Utilização de EPIs", photoKey: "safety_epi_photo" },
    { key: "safety_cleaning", label: "Limpeza e Organização", photoKey: "safety_cleaning_photo" },
    { key: "safety_dds", label: "DDS Realizado", photoKey: "safety_dds_photo" },
  ];

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit, (e) => console.log(e))} className="space-y-6">
        <UpgradeModal 
            open={showUpgrade} 
            onOpenChange={setShowUpgrade} 
            title="Recurso Exclusivo PRO"
            description="Assinaturas digitais e checklist de segurança estão disponíveis apenas para assinantes."
        />

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
                  <p className="text-xs font-black text-primary uppercase">Custo do Dia (Equipe + Máquinas)</p>
                  <h2 className="text-2xl font-black">{formatCurrency(estimatedDailyCost)}</h2>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button type="button" variant="outline" className="flex-1 sm:flex-none rounded-xl font-bold uppercase text-xs border-green-600 text-green-700 hover:bg-green-50">
                            <DollarSign className="w-4 h-4 mr-2" /> Gerar Pagamento
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Registrar Pagamento no Financeiro?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Será criado um lançamento de <strong>{formatCurrency(estimatedDailyCost)}</strong> na categoria "Mão de Obra".
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={handlePayRdo} className="bg-green-600 hover:bg-green-700">Confirmar</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

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

        <Card className="border-none shadow-clean bg-accent/20">
          <CardContent className="p-4 grid grid-cols-1 gap-6">
            <FormField
              control={methods.control}
              name="periodo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1 mb-2">
                    <Clock className="w-3 h-3" /> Períodos Ativos
                  </FormLabel>
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

            <div className="space-y-4">
                {activePeriodsList.length > 0 ? activePeriodsList.map(period => (
                    <div key={period} className="flex flex-col sm:flex-row items-center gap-3 bg-white p-3 rounded-xl border shadow-sm">
                        <span className="text-xs font-black uppercase text-primary w-full sm:w-16 text-center bg-primary/10 rounded-md py-1">{period}</span>
                        
                        <div className="flex-1 w-full">
                            <Label className="text-[9px] uppercase text-muted-foreground font-bold mb-1 block">Clima</Label>
                            <Select 
                                value={weatherMap[period] || 'Sol'} 
                                onValueChange={(val) => setWeatherMap(prev => ({ ...prev, [period]: val }))}
                            >
                                <SelectTrigger className="h-8 text-xs font-medium">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {climaOptions.map(opt => <SelectItem key={opt} value={opt} className="text-xs">{opt}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex-1 w-full">
                            <Label className="text-[9px] uppercase text-muted-foreground font-bold mb-1 block">Status Operacional</Label>
                            <Select 
                                value={statusMap[period] || 'Operacional'} 
                                onValueChange={(val) => setStatusMap(prev => ({ ...prev, [period]: val }))}
                            >
                                <SelectTrigger className="h-8 text-xs font-medium">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {statusOptions.map(opt => <SelectItem key={opt} value={opt} className="text-xs">{opt}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                )) : (
                    <p className="text-xs text-muted-foreground italic p-2 text-center">Selecione um período acima para configurar clima e status.</p>
                )}
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="atividades" className="w-full">
          <TabsList className="grid w-full grid-cols-3 md:grid-cols-5 h-auto bg-muted/50 p-1 rounded-xl gap-1">
            <TabsTrigger value="atividades" className="rounded-lg text-[10px] uppercase font-black py-2">Serviços</TabsTrigger>
            <TabsTrigger value="mao_de_obra" className="rounded-lg text-[10px] uppercase font-black py-2">Equipe</TabsTrigger>
            <TabsTrigger value="equipamentos" className="rounded-lg text-[10px] uppercase font-black py-2">Máquinas</TabsTrigger>
            <TabsTrigger value="materiais" className="rounded-lg text-[10px] uppercase font-black py-2">Materiais</TabsTrigger>
            <TabsTrigger value="seguranca" className="rounded-lg text-[10px] uppercase font-black py-2 md:col-span-1 col-span-3">Segurança</TabsTrigger>
          </TabsList>
          
          <TabsContent value="atividades" className="pt-4"><RdoActivitiesForm obraId={obraId} /></TabsContent>
          <TabsContent value="mao_de_obra" className="pt-4"><RdoManpowerForm /></TabsContent>
          <TabsContent value="equipamentos" className="pt-4"><RdoEquipmentForm /></TabsContent>
          <TabsContent value="materiais" className="pt-4"><RdoMaterialsForm /></TabsContent>
          
          <TabsContent value="seguranca" className="pt-4">
            <Card className="border-l-4 border-l-primary shadow-sm bg-white">
                <CardHeader className="bg-primary/5 pb-2 py-3">
                    <CardTitle className="text-sm font-black uppercase text-primary flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5" /> Controle de Segurança (EPI / DDS)
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-6">
                    {!isPro ? (
                        <div className="flex flex-col items-center justify-center gap-4 py-8 bg-accent/10 rounded-xl" onClick={() => setShowUpgrade(true)}>
                            <Lock className="w-10 h-10 text-muted-foreground/30" />
                            <p className="text-sm text-muted-foreground font-medium text-center px-4">
                                Checklist de segurança e registro fotográfico são recursos exclusivos PRO.
                            </p>
                            <Button size="sm" onClick={() => setShowUpgrade(true)}>Liberar Acesso</Button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {safetyItems.map((item) => {
                                const isChecked = methods.watch(item.key as any);
                                const photoUrl = methods.watch(item.photoKey as any);
                                const isUploading = uploadingState[item.photoKey];

                                return (
                                    <div key={item.key} className={cn("p-4 rounded-xl border transition-all", isChecked ? "border-green-200 bg-green-50/50" : "bg-slate-50")}>
                                        <div className="flex items-center justify-between mb-3">
                                            <Label className="text-xs font-black uppercase cursor-pointer">{item.label}</Label>
                                            <FormField control={methods.control} name={item.key as any} render={({ field }) => (
                                                <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                            )} />
                                        </div>
                                        
                                        {isChecked && (
                                            <div className="mt-2 animate-in fade-in slide-in-from-top-1">
                                                {photoUrl ? (
                                                    <div className="relative w-full h-32 rounded-lg overflow-hidden border bg-black/5">
                                                        <img src={photoUrl} alt={item.label} className="w-full h-full object-cover" />
                                                        <button 
                                                            type="button" 
                                                            onClick={() => methods.setValue(item.photoKey as any, null, { shouldDirty: true })} 
                                                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 shadow-sm hover:bg-red-600"
                                                        >
                                                            <X className="w-3 h-3" />
                                                        </button>
                                                        <div className="absolute bottom-0 left-0 w-full bg-black/50 p-1">
                                                            <p className="text-[9px] text-white text-center font-bold uppercase flex items-center justify-center gap-1">
                                                                <CheckCircle className="w-3 h-3" /> Comprovado
                                                            </p>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-primary/30 rounded-lg cursor-pointer hover:bg-primary/5 transition-colors bg-white">
                                                        {isUploading ? (
                                                            <Loader2 className="w-5 h-5 animate-spin text-primary" />
                                                        ) : (
                                                            <>
                                                                <Upload className="w-5 h-5 text-primary mb-1" />
                                                                <span className="text-[9px] font-bold text-primary uppercase">Adicionar Foto</span>
                                                            </>
                                                        )}
                                                        <input type="file" className="hidden" accept="image/*" onChange={(e) => handlePhotoUpload(e, item.photoKey)} disabled={isUploading} />
                                                    </label>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
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