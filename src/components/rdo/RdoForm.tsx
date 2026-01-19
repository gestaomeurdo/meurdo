"use client";

import { useForm, FormProvider, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { showError, showSuccess } from "@/utils/toast";
import { AlertCircle, Lock, Signature, Clock, MessageSquare, UserCheck, Smartphone } from "lucide-react";
import { DiarioObra, useCreateRdo, useUpdateRdo, useRdoList } from "@/hooks/use-rdo";
import { RdoSchema, RdoFormValues } from "@/schemas/rdo-schema";
import RdoHeader from "./RdoHeader";
import RdoPeriodRow from "./RdoPeriodRow";
import RdoActivitiesForm from "./RdoActivitiesForm";
import RdoManpowerForm from "./RdoManpowerForm";
import RdoEquipmentForm from "./RdoEquipmentForm";
import RdoMaterialsForm from "./RdoMaterialsForm";
import RdoSafetyForm from "./RdoSafetyForm";
import RdoSignaturePad from "./RdoSignaturePad";
import RdoShareMenu from "./RdoShareMenu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMemo, useEffect, useState } from "react";
import { useObras } from "@/hooks/use-obras";
import { useAuth } from "@/integrations/supabase/auth-provider";
import UpgradeModal from "../subscription/UpgradeModal";
import { format } from "date-fns";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface RdoFormProps {
  obraId: string;
  initialData?: DiarioObra;
  onSuccess: () => void;
  selectedDate?: Date;
}

const statusStyles: Record<string, { bg: string, text: string, label: string, border: string }> = {
    'draft': { bg: 'bg-slate-100', text: 'text-slate-600', label: 'Rascunho', border: 'border-slate-200' },
    'pending': { bg: 'bg-orange-100', text: 'text-orange-600', label: 'Aguardando Cliente', border: 'border-orange-200' },
    'approved': { bg: 'bg-green-100', text: 'text-green-700', label: 'Aprovado ✅', border: 'border-green-300' },
    'rejected': { bg: 'bg-red-100', text: 'text-red-600', label: 'Correção Solicitada', border: 'border-red-200' },
};

const RdoForm = ({ obraId, initialData, onSuccess, selectedDate }: RdoFormProps) => {
  const { profile } = useAuth();
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [isManualClientSig, setIsManualClientSig] = useState(false);
  const isEditing = !!initialData;
  const currentStatus = initialData?.status || 'draft';
  const statusConfig = statusStyles[currentStatus];
  const isApproved = currentStatus === 'approved';
  
  const isPro = profile?.subscription_status === 'active' || profile?.plan_type === 'pro';
  const createMutation = useCreateRdo();
  const updateMutation = useUpdateRdo();
  const { data: obras } = useObras();
  const { data: rdoList } = useRdoList(obraId);

  const methods = useForm<RdoFormValues>({
    resolver: zodResolver(RdoSchema),
  });

  const parseSavedClima = (data: string | null) => {
    const def = { me: true, m: "Sol", ms: "Operacional", ae: true, a: "Sol", as: "Operacional", ne: false, n: "Sol", ns: "Operacional" };
    if (!data) return def;
    const parts = data.split(', ');
    const getVal = (idx: number) => {
        const raw = parts[idx];
        if (!raw || raw.includes("N/T")) return { c: "Sol", s: "Operacional", e: false };
        const climaMatch = raw.match(/:\s*([^(\n,]*)/);
        const statusMatch = raw.match(/\((.*?)\)/);
        return { c: climaMatch ? climaMatch[1].trim() : "Sol", s: statusMatch && statusMatch[1] === "Par" ? "Paralisado" : "Operacional", e: true };
    };
    const m = getVal(0); const a = getVal(1); const n = getVal(2);
    return { me: m.e, m: m.c, ms: m.s, ae: a.e, a: a.c, as: a.s, ne: n.e, n: n.c, ns: n.s };
  };

  useEffect(() => {
    const saved = parseSavedClima(initialData?.clima_condicoes || null);
    methods.reset({
      obra_id: obraId,
      data_rdo: initialData?.data_rdo ? new Date(initialData.data_rdo + 'T12:00:00') : (selectedDate || new Date()),
      morning_enabled: saved.me, morning_clima: saved.m, morning_status: saved.ms,
      afternoon_enabled: saved.ae, afternoon_clima: saved.a, afternoon_status: saved.as,
      night_enabled: saved.ne, night_clima: saved.n, night_status: saved.ns,
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
      atividades: initialData?.rdo_atividades_detalhe?.map(a => ({ descricao_servico: a.descricao_servico, avanco_percentual: a.avanco_percentual, foto_anexo_url: a.foto_anexo_url, observacao: a.observacao })) || [],
      mao_de_obra: initialData?.rdo_mao_de_obra?.map(m => ({ funcao: m.funcao, quantidade: m.quantidade, custo_unitario: m.custo_unitario, tipo: m.tipo || 'Própria', observacao: (m as any).observacao })) || [],
      equipamentos: initialData?.rdo_equipamentos?.map(e => ({ equipamento: e.equipamento, horas_trabalhadas: e.horas_trabalhadas, horas_paradas: e.horas_paradas, custo_hora: e.custo_hora || 0, observacao: (e as any).observacao, foto_url: (e as any).foto_url })) || [],
      materiais: initialData?.rdo_materiais?.map(m => ({ nome_material: m.nome_material, unidade: m.unidade, quantidade_entrada: m.quantidade_entrada || 0, quantidade_consumida: m.quantidade_consumida, observacao: m.observacao })) || [],
    });
  }, [initialData, obraId, profile, methods, selectedDate]);

  const maoDeObra = useWatch({ control: methods.control, name: "mao_de_obra" });
  const equipamentos = useWatch({ control: methods.control, name: "equipamentos" });

  const estimatedDailyCost = useMemo(() => {
    const mCost = maoDeObra?.reduce((sum, item) => (sum + (Number(item.quantidade || 0) * Number(item.custo_unitario || 0))), 0) || 0;
    const eCost = equipamentos?.reduce((sum, item) => (sum + (Number(item.horas_trabalhadas || 0) * Number(item.custo_hora || 0))), 0) || 0;
    return mCost + eCost;
  }, [maoDeObra, equipamentos]);

  const onSubmit = async (values: RdoFormValues) => {
    try {
      const getP = (en: boolean, c: string, s: string, prefix: string) => en ? `${prefix}: ${c} (${s === "Operacional" ? "Op" : "Par"})` : `${prefix}: N/T`;
      const climaString = `${getP(values.morning_enabled, values.morning_clima, values.morning_status, "M")}, ${getP(values.afternoon_enabled, values.afternoon_clima, values.afternoon_status, "T")}, ${getP(values.night_enabled, values.night_clima, values.night_status, "N")}`;
      const { morning_enabled, morning_clima, morning_status, afternoon_enabled, afternoon_clima, afternoon_status, night_enabled, night_clima, night_status, ...dbValues } = values;
      const data = { ...dbValues, data_rdo: format(values.data_rdo, 'yyyy-MM-dd'), clima_condicoes: climaString };

      if (isEditing && initialData) {
        await updateMutation.mutateAsync({ ...data, id: initialData.id } as any);
        showSuccess("RDO atualizado!");
      } else {
        await createMutation.mutateAsync(data as any);
        showSuccess("RDO criado!");
      }
      onSuccess();
    } catch (error: any) { showError(error.message || "Falha ao salvar."); }
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-6">
        <UpgradeModal open={showUpgrade} onOpenChange={setShowUpgrade} />

        <RdoHeader 
          estimatedDailyCost={estimatedDailyCost}
          currentStatus={currentStatus}
          statusConfig={statusConfig}
          isApproved={isApproved}
          isEditing={isEditing}
          obraId={obraId}
          obraNome={obras?.find(o => o.id === obraId)?.nome || "Obra"}
          approvalToken={initialData?.approval_token}
          rdoId={initialData?.id}
          initialData={initialData}
          profile={profile}
          selectedObra={obras?.find(o => o.id === obraId)}
          rdoList={rdoList}
          isPending={updateMutation.isPending || createMutation.isPending}
        />

        {initialData?.status === 'rejected' && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 animate-in slide-in-from-top-2">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
            <div className="space-y-1">
              <p className="text-xs font-black text-red-800 uppercase">Correção Solicitada</p>
              <p className="text-sm text-red-700 font-medium italic">"{initialData.rejection_reason}"</p>
            </div>
          </div>
        )}

        <div className="bg-card border rounded-3xl p-5 space-y-1">
          <RdoPeriodRow label="Manhã" enabledName="morning_enabled" climaName="morning_clima" statusName="morning_status" isApproved={isApproved} />
          <RdoPeriodRow label="Tarde" enabledName="afternoon_enabled" climaName="afternoon_clima" statusName="afternoon_status" isApproved={isApproved} />
          <RdoPeriodRow label="Noite" enabledName="night_enabled" climaName="night_clima" statusName="night_status" isApproved={isApproved} />
        </div>

        <Tabs defaultValue="atividades" className="w-full">
          <TabsList className="grid w-full grid-cols-3 md:grid-cols-7 h-auto bg-muted/40 p-1 rounded-2xl gap-1 border">
            <TabsTrigger value="atividades" className="rounded-xl text-[9px] uppercase font-black py-2.5 data-[state=active]:bg-white">Serviços</TabsTrigger>
            <TabsTrigger value="mao_de_obra" className="rounded-xl text-[9px] uppercase font-black py-2.5 data-[state=active]:bg-white">Equipe</TabsTrigger>
            <TabsTrigger value="equipamentos" className="rounded-xl text-[9px] uppercase font-black py-2.5 data-[state=active]:bg-white">Máquinas</TabsTrigger>
            <TabsTrigger value="materiais" className="rounded-xl text-[9px] uppercase font-black py-2.5 data-[state=active]:bg-white">Materiais</TabsTrigger>
            <TabsTrigger value="seguranca" className="rounded-xl text-[9px] uppercase font-black py-2.5 data-[state=active]:bg-white">Segurança</TabsTrigger>
            <TabsTrigger value="ocorrencias" className="rounded-xl text-[9px] uppercase font-black py-2.5 data-[state=active]:bg-white">Ocorrências</TabsTrigger>
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
                <FormLabel className="text-[10px] font-black uppercase text-destructive tracking-widest ml-2">Impedimentos</FormLabel>
                <FormControl><Textarea {...field} value={field.value || ""} rows={4} className="bg-red-50/5 rounded-2xl" placeholder="Descreva problemas..." disabled={isApproved} /></FormControl>
              </FormItem>
            )} />
            <FormField control={methods.control} name="observacoes_gerais" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[10px] font-black uppercase text-primary tracking-widest ml-2">Observações Gerais</FormLabel>
                <FormControl><Textarea {...field} value={field.value || ""} rows={4} className="rounded-2xl" placeholder="Notas adicionais..." disabled={isApproved} /></FormControl>
              </FormItem>
            )} />
          </TabsContent>
          <TabsContent value="assinaturas" className="pt-6">
            <div className="space-y-6">
              {isPro ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground ml-2">Assinatura Responsável (Você)</Label>
                    <RdoSignaturePad diarioId={initialData?.id || 'new'} obraId={obraId} currentSignatureUrl={methods.watch('responsible_signature_url') || null} onSignatureSave={(url) => methods.setValue('responsible_signature_url', url, { shouldDirty: true })} disabled={isApproved} />
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground ml-2">Assinatura do Cliente</Label>
                    
                    {!isApproved && !isManualClientSig ? (
                        <Card className="border-dashed border-2 bg-slate-50/50 min-h-[220px] flex flex-col items-center justify-center text-center p-6 rounded-2xl transition-all hover:bg-slate-50">
                            <Clock className="w-10 h-10 text-orange-400 mb-4 animate-pulse" />
                            <h4 className="font-bold text-sm text-slate-800 uppercase tracking-tight">Aguardando Validação Remota</h4>
                            <p className="text-[10px] text-muted-foreground mt-1 max-w-[200px]">
                                O cliente deve assinar através do link enviado pelo WhatsApp.
                            </p>
                            
                            <div className="mt-6 w-full space-y-3">
                                <RdoShareMenu 
                                    obraId={obraId} 
                                    obraNome={obras?.find(o => o.id === obraId)?.nome || "Obra"} 
                                    approvalToken={initialData?.approval_token} 
                                    isEditing={isEditing} 
                                    isApproved={isApproved} 
                                    rdoId={initialData?.id} 
                                />
                                <button 
                                    type="button"
                                    onClick={() => setIsManualClientSig(true)}
                                    className="text-[9px] font-black text-primary uppercase tracking-widest hover:underline block w-full text-center"
                                >
                                    <Smartphone className="w-3 h-3 inline mr-1" /> Assinar Presencialmente
                                </button>
                            </div>
                        </Card>
                    ) : (
                        <div className="relative">
                            <RdoSignaturePad 
                                diarioId={initialData?.id || 'new-client'} 
                                obraId={obraId} 
                                currentSignatureUrl={methods.watch('client_signature_url') || null} 
                                onSignatureSave={(url) => methods.setValue('client_signature_url', url, { shouldDirty: true })} 
                                disabled={isApproved} 
                            />
                            {isManualClientSig && !isApproved && (
                                <button 
                                    onClick={() => setIsManualClientSig(false)}
                                    className="absolute -top-2 -right-2 bg-slate-200 text-slate-600 rounded-full p-1 hover:bg-slate-300"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            )}
                        </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-10 text-center bg-muted/10 rounded-[2.5rem] border-dashed border-2 cursor-pointer" onClick={() => setShowUpgrade(true)}>
                  <Lock className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="text-[10px] font-black uppercase tracking-widest">Assinaturas Digitais Exclusivas PRO</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </form>
    </FormProvider>
  );
};

export default RdoForm;