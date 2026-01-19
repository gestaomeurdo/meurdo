"use client";

import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Textarea } from "@/components/ui/textarea";
import { showError, showSuccess } from "@/utils/toast";
import { Clock, Smartphone, Info, ShieldCheck, ListTodo, Users, Truck, Package, MessageSquare, Signature } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEffect, useState } from "react";
import { useObras } from "@/hooks/use-obras";
import { useAuth } from "@/integrations/supabase/auth-provider";
import UpgradeModal from "../subscription/UpgradeModal";
import { format } from "date-fns";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface RdoFormProps {
  obraId: string;
  initialData?: DiarioObra;
  onSuccess: () => void;
  selectedDate?: Date;
  previousRdoData?: DiarioObra | null;
}

const statusStyles: Record<string, { bg: string, text: string, label: string, border: string }> = {
    'draft': { bg: 'bg-slate-300', text: 'text-slate-900', label: 'Rascunho', border: 'border-slate-300' },
    'pending': { bg: 'bg-orange-100', text: 'text-orange-600', label: 'Aguardando Cliente', border: 'border-orange-200' },
    'approved': { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Aprovado ✓', border: 'border-emerald-300' },
    'rejected': { bg: 'bg-red-100', text: 'text-red-600', label: 'Correção Requerida', border: 'border-red-200' },
};

const RdoForm = ({ obraId, initialData, onSuccess, selectedDate, previousRdoData }: RdoFormProps) => {
  const { profile } = useAuth();
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [isManualClientSig, setIsManualClientSig] = useState(false);
  
  const isEditing = !!initialData;
  const currentStatus = initialData?.status || 'draft';
  const statusConfig = statusStyles[currentStatus];
  const isApproved = currentStatus === 'approved';
  
  const createMutation = useCreateRdo();
  const updateMutation = useUpdateRdo();
  const { data: obras } = useObras();
  const { data: rdoList } = useRdoList(obraId);

  const methods = useForm<RdoFormValues>({
    resolver: zodResolver(RdoSchema),
    defaultValues: {
        mao_de_obra: [],
        equipamentos: [],
        atividades: [],
        materiais: []
    }
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
        return { c: climaMatch ? climaMatch[1].trim() : "Sol", s: statusMatch && (statusMatch[1] === "Par" || statusMatch[1] === "Paralisado") ? "Paralisado" : "Operacional", e: true };
    };
    return { me: getVal(0).e, m: getVal(0).c, ms: getVal(0).s, ae: getVal(1).e, a: getVal(1).c, as: getVal(1).s, ne: getVal(2).e, n: getVal(2).c, ns: getVal(2).s };
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
      signer_name: (initialData as any)?.signer_name || "",
      safety_nr35: initialData?.safety_nr35 || false,
      safety_epi: initialData?.safety_epi || false,
      safety_cleaning: initialData?.safety_cleaning || false,
      safety_dds: initialData?.safety_dds || false,
      safety_comments: initialData?.safety_comments || "",
      atividades: initialData?.rdo_atividades_detalhe || [],
      mao_de_obra: initialData?.rdo_mao_de_obra || [],
      equipamentos: initialData?.rdo_equipamentos || [],
      materiais: initialData?.rdo_materiais || [],
    });
  }, [initialData, obraId, profile, methods, selectedDate]);

  const handleCopyPrevious = () => {
    if (!previousRdoData) {
        showError("Não encontramos um diário anterior para copiar.");
        return;
    }
    methods.setValue('mao_de_obra', previousRdoData.rdo_mao_de_obra?.map(m => ({
        funcao: m.funcao, quantidade: m.quantidade, custo_unitario: m.custo_unitario, tipo: m.tipo, observacao: null
    })) || [], { shouldDirty: true });
    methods.setValue('equipamentos', previousRdoData.rdo_equipamentos?.map(e => ({
        equipamento: e.equipamento, horas_trabalhadas: 0, horas_paradas: 0, custo_hora: e.custo_hora, observacao: null
    })) || [], { shouldDirty: true });
    showSuccess("Dados de equipe e máquinas copiados!");
  };

  const onSubmit = async (values: RdoFormValues) => {
    try {
      const getP = (en: boolean, c: string, s: string, prefix: string) => en ? `${prefix}: ${c} (${s === "Operacional" ? "Op" : "Par"})` : `${prefix}: N/T`;
      const climaString = `${getP(values.morning_enabled, values.morning_clima, values.morning_status, "M")}, ${getP(values.afternoon_enabled, values.afternoon_clima, values.afternoon_status, "T")}, ${getP(values.night_enabled, values.night_clima, values.night_status, "N")}`;
      const { morning_enabled, morning_clima, morning_status, afternoon_enabled, afternoon_clima, afternoon_status, night_enabled, night_clima, night_status, ...dbValues } = values;
      const data = { ...dbValues, data_rdo: format(values.data_rdo, 'yyyy-MM-dd'), clima_condicoes: climaString };

      if (isEditing && initialData) {
        await updateMutation.mutateAsync({ ...data, id: initialData.id } as any);
        showSuccess("Atualizado!");
      } else {
        await createMutation.mutateAsync(data as any);
        showSuccess("Criado!");
      }
      onSuccess();
    } catch (error: any) { showError(error.message); }
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-6">
        <UpgradeModal open={showUpgrade} onOpenChange={setShowUpgrade} />

        <RdoHeader 
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
          onCopyPrevious={!isApproved ? handleCopyPrevious : undefined}
        />

        <div className="bg-white border rounded-[2rem] p-2 space-y-0 overflow-hidden shadow-sm">
          <RdoPeriodRow label="Manhã" enabledName="morning_enabled" climaName="morning_clima" statusName="morning_status" isApproved={isApproved} />
          <div className="h-px bg-slate-100 mx-6" />
          <RdoPeriodRow label="Tarde" enabledName="afternoon_enabled" climaName="afternoon_clima" statusName="afternoon_status" isApproved={isApproved} />
          <div className="h-px bg-slate-100 mx-6" />
          <RdoPeriodRow label="Noite" enabledName="night_enabled" climaName="night_clima" statusName="night_status" isApproved={isApproved} />
        </div>

        <Tabs defaultValue="atividades" className="w-full">
          <TabsList className="grid w-full grid-cols-3 md:grid-cols-7 h-auto bg-muted/40 p-1 rounded-2xl gap-1 border">
            <TabsTrigger value="atividades" className="rounded-xl text-[9px] uppercase font-black py-3 data-[state=active]:bg-white flex items-center gap-1.5"><ListTodo className="w-3 h-3" /> Serviços</TabsTrigger>
            <TabsTrigger value="mao_de_obra" className="rounded-xl text-[9px] uppercase font-black py-3 data-[state=active]:bg-white flex items-center gap-1.5"><Users className="w-3 h-3" /> Equipe</TabsTrigger>
            <TabsTrigger value="equipamentos" className="rounded-xl text-[9px] uppercase font-black py-3 data-[state=active]:bg-white flex items-center gap-1.5"><Truck className="w-3 h-3" /> Máquinas</TabsTrigger>
            <TabsTrigger value="materiais" className="rounded-xl text-[9px] uppercase font-black py-3 data-[state=active]:bg-white flex items-center gap-1.5"><Package className="w-3 h-3" /> Insumos</TabsTrigger>
            <TabsTrigger value="seguranca" className="rounded-xl text-[9px] uppercase font-black py-3 data-[state=active]:bg-white flex items-center gap-1.5"><ShieldCheck className="w-3 h-3" /> Segurança</TabsTrigger>
            <TabsTrigger value="ocorrencias" className="rounded-xl text-[9px] uppercase font-black py-3 data-[state=active]:bg-white flex items-center gap-1.5"><MessageSquare className="w-3 h-3" /> Notas</TabsTrigger>
            <TabsTrigger value="assinaturas" className="rounded-xl text-[9px] uppercase font-black py-3 data-[state=active]:bg-[#066abc] data-[state=active]:text-white flex items-center gap-1.5"><Signature className="w-3 h-3" /> Validar</TabsTrigger>
          </TabsList>
          
          <div className="min-h-[550px] pt-6">
            <TabsContent value="atividades"><RdoActivitiesForm obraId={obraId} /></TabsContent>
            <TabsContent value="mao_de_obra"><RdoManpowerForm /></TabsContent>
            <TabsContent value="equipamentos"><RdoEquipmentForm /></TabsContent>
            <TabsContent value="materiais"><RdoMaterialsForm /></TabsContent>
            <TabsContent value="seguranca"><RdoSafetyForm /></TabsContent>
            <TabsContent value="ocorrencias" className="space-y-6">
                <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-destructive tracking-widest ml-1">Relato de Impedimentos / Ocorrências</Label>
                    <Textarea {...methods.register("impedimentos_comentarios")} rows={6} className="bg-red-50/10 rounded-2xl border-red-100" placeholder="Houve quebra de máquina? Falta de material? Descreva aqui..." disabled={isApproved} />
                </div>
                <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Observações Gerais</Label>
                    <Textarea {...methods.register("observacoes_gerais")} rows={6} className="rounded-2xl" placeholder="Notas técnicas adicionais sobre a execução..." disabled={isApproved} />
                </div>
            </TabsContent>
            <TabsContent value="assinaturas">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                        <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2">Responsável Técnico (Construtora)</Label>
                        <RdoSignaturePad diarioId={initialData?.id || 'new'} obraId={obraId} currentSignatureUrl={methods.watch('responsible_signature_url') || null} onSignatureSave={(url) => methods.setValue('responsible_signature_url', url)} disabled={isApproved} />
                    </div>
                    <div className="space-y-3">
                        <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2">Validação do Cliente (Contratante)</Label>
                        {!isApproved && !isManualClientSig ? (
                            <Card className="border-dashed border-2 bg-slate-50 min-h-[220px] flex flex-col items-center justify-center p-8 rounded-[2rem]">
                                <Clock className="w-10 h-10 text-orange-400 mb-4 animate-pulse" />
                                <h4 className="font-bold text-sm uppercase">Aguardando Envio</h4>
                                <Button variant="link" onClick={() => setIsManualClientSig(true)} className="text-[10px] font-black uppercase text-primary mt-4">Assinar Agora (Presencial)</Button>
                            </Card>
                        ) : (
                            <RdoSignaturePad diarioId={initialData?.id || 'client'} obraId={obraId} currentSignatureUrl={methods.watch('client_signature_url') || null} onSignatureSave={(url) => methods.setValue('client_signature_url', url)} disabled={isApproved} />
                        )}
                    </div>
                </div>
            </TabsContent>
          </div>
        </Tabs>
      </form>
    </FormProvider>
  );
};

export default RdoForm;