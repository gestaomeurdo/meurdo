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
import { Loader2, Save, FileDown, DollarSign, Lock, ShieldCheck, UserCheck, CalendarIcon, Sun, AlertOctagon, Clock } from "lucide-react";
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
import { ptBR } from "date-fns/locale";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

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
}

const RdoForm = ({ obraId, initialData, onSuccess }: RdoFormProps) => {
  const { profile } = useAuth();
  const [showUpgrade, setShowUpgrade] = useState(false);
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

  const maoDeObra = methods.watch("mao_de_obra");
  const workStopped = methods.watch("work_stopped");

  const estimatedDailyCost = useMemo(() => {
    return maoDeObra?.reduce((sum, item) => sum + (item.quantidade * (item.custo_unitario || 0)), 0) || 0;
  }, [maoDeObra]);

  const handleExportPdf = () => {
    if (initialData) {
      const currentData: DiarioObra = {
        ...initialData,
        ...methods.getValues() as any, // Pega os valores atuais do form
        rdo_mao_de_obra: methods.getValues('mao_de_obra') as any,
        rdo_materiais: methods.getValues('materiais') as any,
        rdo_atividades_detalhe: methods.getValues('atividades') as any,
      };
      generateRdoPdf(currentData, obraNome, profile);
    } else {
      showError("Salve o RDO antes de exportar.");
    }
  };

  const onInvalid = (errors: any) => {
    console.error("Erros de validação:", errors);
    if (errors.atividades) {
      const atividadesErrors = errors.atividades;
      if (Array.isArray(atividadesErrors)) {
         if(atividadesErrors[0]?.descricao_servico) {
             showError("Preencha a descrição da atividade (mínimo 5 letras).");
             return;
         }
      }
      showError("Verifique a aba 'Serviços': " + (errors.atividades.message || "Dados inválidos"));
    } else {
      showError("Verifique os campos obrigatórios em vermelho.");
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
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-primary/10 rounded-2xl border border-primary/20 gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-primary p-2 rounded-lg text-primary-foreground"><DollarSign className="w-5 h-5" /></div>
            <div>
              <p className="text-xs font-black text-primary uppercase">Custo Estimado</p>
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

        {/* Informações Gerais (Data, Clima, Status) */}
        <Card className="border-none shadow-clean bg-accent/20">
          <CardContent className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              control={methods.control}
              name="data_rdo"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1"><CalendarIcon className="w-3 h-3" /> Data do RDO</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn("w-full pl-3 text-left font-normal rounded-xl bg-white border-none shadow-sm", !field.value && "text-muted-foreground")}
                        >
                          {field.value ? format(field.value, "dd 'de' MMMM, yyyy", { locale: ptBR }) : <span>Selecione</span>}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={methods.control}
              name="status_dia"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1"><AlertOctagon className="w-3 h-3" /> Status Operacional</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="rounded-xl bg-white border-none shadow-sm">
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
              name="clima_condicoes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1"><Sun className="w-3 h-3" /> Condições Climáticas</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value || undefined}>
                    <FormControl>
                      <SelectTrigger className="rounded-xl bg-white border-none shadow-sm">
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
          {/* Paralisação */}
          <div className="px-4 pb-4 border-t border-muted-foreground/10 pt-3 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
             <FormField
                control={methods.control}
                name="work_stopped"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center gap-2 space-y-0">
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel className="font-medium text-sm cursor-pointer text-muted-foreground">Houve paralisação?</FormLabel>
                  </FormItem>
                )}
              />
              {workStopped && (
                <FormField
                  control={methods.control}
                  name="hours_lost"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-2 space-y-0 animate-in fade-in slide-in-from-left-2">
                      <FormLabel className="whitespace-nowrap text-xs font-bold uppercase text-destructive flex items-center gap-1"><Clock className="w-3 h-3" /> Horas Perdidas</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} className="w-20 h-8 rounded-lg bg-white border-destructive/30" />
                      </FormControl>
                    </FormItem>
                  )}
                />
              )}
          </div>
        </Card>

        <Tabs defaultValue="atividades" className="w-full">
          <TabsList className="grid w-full grid-cols-3 md:grid-cols-6 h-auto bg-muted/50 p-1 rounded-xl gap-1">
            <TabsTrigger value="atividades" className="rounded-lg text-[10px] uppercase font-black py-2">Serviços</TabsTrigger>
            <TabsTrigger value="mao_de_obra" className="rounded-lg text-[10px] uppercase font-black py-2">Equipe</TabsTrigger>
            <TabsTrigger value="seguranca" className="rounded-lg text-[10px] uppercase font-black text-primary py-2">Segur.</TabsTrigger>
            <TabsTrigger value="equipamentos" className="rounded-lg text-[10px] uppercase font-black py-2">Máq.</TabsTrigger>
            <TabsTrigger value="materiais" className="rounded-lg text-[10px] uppercase font-black py-2">Mat.</TabsTrigger>
            <TabsTrigger value="ocorrencias" className="rounded-lg text-[10px] uppercase font-black py-2">Notas</TabsTrigger>
          </TabsList>
          
          <TabsContent value="atividades" className="pt-4"><RdoActivitiesForm obraId={obraId} /></TabsContent>
          <TabsContent value="mao_de_obra" className="pt-4"><RdoManpowerForm /></TabsContent>
          
          <TabsContent value="seguranca" className="pt-4 space-y-6">
            <div className="flex items-center gap-3 border-b pb-4 mb-4">
              <ShieldCheck className="h-8 w-8 text-primary" />
              <div>
                <h3 className="text-xl font-black text-primary uppercase tracking-tight">Segurança do Trabalho</h3>
                <p className="text-xs text-muted-foreground font-medium">Proteção e conformidade técnica.</p>
              </div>
            </div>
            {!isPro ? (
              <div className="border-dashed border-primary/30 bg-accent/30 py-10 rounded-3xl cursor-pointer flex flex-col items-center text-center space-y-4" onClick={() => setShowUpgrade(true)}>
                <Lock className="w-12 h-12 text-primary/40" />
                <div className="space-y-2">
                  <h4 className="font-bold text-lg">Checklist PRO</h4>
                  <p className="text-xs text-muted-foreground">Desbloqueie para salvar os itens de conformidade.</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { name: "safety_nr35", label: "NR-35 (Altura)", desc: "Cintos e ancoragem OK." },
                  { name: "safety_epi", label: "Uso de EPIs", desc: "Equipe 100% protegida." },
                  { name: "safety_cleaning", label: "Organização", desc: "Canteiro limpo." },
                  { name: "safety_dds", label: "DDS Realizado", desc: "Instrução matinal feita." },
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
              <FormItem><FormLabel className="text-xs uppercase font-bold text-muted-foreground">Impedimentos / Ocorrências</FormLabel><FormControl><Textarea {...field} value={field.value || ""} rows={3} className="rounded-xl" /></FormControl></FormItem>
            )} />
          </TabsContent>
        </Tabs>

        <div className="pt-6 border-t space-y-4">
          <div className="flex items-center gap-2"><UserCheck className="w-5 h-5 text-primary" /><h2 className="text-lg font-black uppercase tracking-tight">Assinatura do Responsável</h2></div>
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <FormField control={methods.control} name="signer_name" render={({ field }) => (
                        <FormItem><FormLabel className="text-[10px] uppercase font-bold text-muted-foreground">Nome do Engenheiro / RT</FormLabel><FormControl><Input placeholder="Nome Completo" {...field} value={field.value || ""} className="rounded-xl" /></FormControl></FormItem>
                    )} />
                    <FormField control={methods.control} name="signer_registration" render={({ field }) => (
                        <FormItem><FormLabel className="text-[10px] uppercase font-bold text-muted-foreground">Registro Profissional (CREA/CAU)</FormLabel><FormControl><Input placeholder="Número do Registro" {...field} value={field.value || ""} className="rounded-xl" /></FormControl></FormItem>
                    )} />
                </div>
                <RdoSignaturePad diarioId={initialData?.id || 'new'} obraId={obraId} currentSignatureUrl={methods.watch('responsible_signature_url') || null} onSignatureSave={(url) => methods.setValue('responsible_signature_url', url, { shouldDirty: true })} />
            </div>
          )}
        </div>
      </form>
    </FormProvider>
  );
};

export default RdoForm;