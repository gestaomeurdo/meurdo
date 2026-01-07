"use client";

import React, { useMemo, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { showSuccess, showError } from "@/utils/toast";
import { CalendarIcon, Loader2, Save, FileDown, DollarSign, Trash2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { 
  DiarioObra, 
  RdoClima, 
  RdoStatusDia, 
  useCreateRdo, 
  useUpdateRdo, 
  useDeleteRdo,
  RdoInput
} from "@/hooks/use-rdo";
import RdoActivitiesForm from "./RdoActivitiesForm";
import RdoManpowerForm from "./RdoManpowerForm";
import RdoEquipmentForm from "./RdoEquipmentForm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency } from "@/utils/formatters";
import { generateRdoPdf } from "@/utils/rdo-pdf";
import { useObras } from "@/hooks/use-obras";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from "@/components/ui/alert-dialog";

const statusOptions: RdoStatusDia[] = ['Operacional', 'Parcialmente Paralisado', 'Totalmente Paralisado - Não Praticável'];
const climaOptions: RdoClima[] = ['Sol', 'Nublado', 'Chuva Leve', 'Chuva Forte'];

const RdoDetailSchema = z.object({
  descricao_servico: z.string().min(5, "Descrição é obrigatória."),
  avanco_percentual: z.number().min(0).max(100),
  foto_anexo_url: z.string().nullable().optional(),
});

const ManpowerSchema = z.object({
  funcao: z.string().min(3, "Função é obrigatória."),
  quantidade: z.number().min(0),
  custo_unitario: z.number().min(0).optional(),
});

const EquipmentSchema = z.object({
  equipamento: z.string().min(3, "Equipamento é obrigatório."),
  horas_trabalhadas: z.number().min(0),
  horas_paradas: z.number().min(0),
});

const RdoSchema = z.object({
  obra_id: z.string().uuid("Obra inválida."),
  data_rdo: z.date({ required_error: "A data é obrigatória." }),
  clima_condicoes: z.enum(climaOptions).nullable().optional(),
  status_dia: z.enum(statusOptions, { required_error: "O status do dia é obrigatório." }),
  observacoes_gerais: z.string().nullable().optional(),
  impedimentos_comentarios: z.string().nullable().optional(),
  atividades: z.array(RdoDetailSchema).min(1, "Pelo menos uma atividade deve ser registrada."),
  mao_de_obra: z.array(ManpowerSchema).optional().default([]),
  equipamentos: z.array(EquipmentSchema).optional().default([]),
});

type RdoFormValues = z.infer<typeof RdoSchema>;

interface RdoFormProps {
  obraId: string;
  initialData?: DiarioObra;
  onSuccess: () => void;
  previousRdoData?: DiarioObra | null; 
}

const RdoForm = ({ obraId, initialData, onSuccess, previousRdoData }: RdoFormProps) => {
  const isEditing = !!initialData;
  const createMutation = useCreateRdo();
  const updateMutation = useUpdateRdo();
  const deleteMutation = useDeleteRdo();
  const { data: obras } = useObras();
  const obraNome = obras?.find(o => o.id === obraId)?.nome || "Obra";

  const form = useForm<RdoFormValues>({
    resolver: zodResolver(RdoSchema),
    defaultValues: {
      obra_id: obraId,
      data_rdo: initialData?.data_rdo ? new Date(initialData.data_rdo + 'T12:00:00') : new Date(),
      clima_condicoes: initialData?.clima_condicoes || undefined,
      status_dia: initialData?.status_dia || 'Operacional',
      observacoes_gerais: initialData?.observacoes_gerais || "",
      impedimentos_comentarios: initialData?.impedimentos_comentarios || "",
      atividades: initialData?.rdo_atividades_detalhe?.map(a => ({
        descricao_servico: a.descricao_servico,
        avanco_percentual: a.avanco_percentual,
        foto_anexo_url: a.foto_anexo_url,
      })) || [{ descricao_servico: "", avanco_percentual: 0, foto_anexo_url: null }],
      mao_de_obra: initialData?.rdo_mao_de_obra?.map(m => ({
        funcao: m.funcao,
        quantidade: m.quantidade,
        custo_unitario: m.custo_unitario,
      })) || [],
      equipamentos: initialData?.rdo_equipamentos?.map(e => ({
        equipamento: e.equipamento,
        horas_trabalhadas: e.horas_trabalhadas,
        horas_paradas: e.horas_paradas,
      })) || [],
    },
  });

  useEffect(() => {
    if (!isEditing && previousRdoData && form.getValues("mao_de_obra")?.length === 0) {
      if (previousRdoData.rdo_mao_de_obra && previousRdoData.rdo_mao_de_obra.length > 0) {
        form.setValue("mao_de_obra", previousRdoData.rdo_mao_de_obra.map(m => ({
          funcao: m.funcao,
          quantidade: m.quantidade,
          custo_unitario: m.custo_unitario || 0,
        })));
      }
      
      if (previousRdoData.rdo_equipamentos && previousRdoData.rdo_equipamentos.length > 0) {
        form.setValue("equipamentos", previousRdoData.rdo_equipamentos.map(e => ({
          equipamento: e.equipamento,
          horas_trabalhadas: e.horas_trabalhadas,
          horas_paradas: e.horas_paradas,
        })));
      }
    }
  }, [previousRdoData, isEditing, form]);

  const watchManpower = form.watch("mao_de_obra");
  const estimatedDailyCost = useMemo(() => {
    return watchManpower?.reduce((sum, item) => sum + (item.quantidade * (item.custo_unitario || 0)), 0) || 0;
  }, [watchManpower]);

  const handleExportPdf = () => {
    if (initialData) {
      generateRdoPdf(initialData, obraNome);
    }
  };

  const handleDelete = async () => {
    if (!initialData) return;
    try {
      await deleteMutation.mutateAsync({ id: initialData.id, obraId });
      showSuccess("RDO excluído com sucesso.");
      onSuccess();
    } catch (error) {
      showError("Erro ao excluir RDO.");
    }
  };

  const onSubmit = async (values: RdoFormValues) => {
    try {
      const dataToSubmit: RdoInput = {
        obra_id: values.obra_id,
        data_rdo: format(values.data_rdo, 'yyyy-MM-dd'),
        clima_condicoes: values.clima_condicoes || null,
        status_dia: values.status_dia,
        observacoes_gerais: values.observacoes_gerais || null,
        impedimentos_comentarios: values.impedimentos_comentarios || null,
        atividades: values.atividades,
        mao_de_obra: values.mao_de_obra?.map(m => ({ ...m, custo_unitario: m.custo_unitario || 0 })) || [],
        equipamentos: values.equipamentos || [],
      };

      if (isEditing && initialData) {
        await updateMutation.mutateAsync({ ...dataToSubmit, id: initialData.id });
        showSuccess("RDO atualizado!");
      } else {
        await createMutation.mutateAsync(dataToSubmit);
        showSuccess("RDO criado!");
      }
      onSuccess();
    } catch (error) {
      showError(`Erro ao salvar: ${error instanceof Error ? error.message : "Erro desconhecido"}`);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-primary/10 rounded-xl border border-primary/20 gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-primary p-2 rounded-lg text-primary-foreground">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-primary uppercase">Custo Estimado do Dia</p>
              <h2 className="text-2xl font-bold">{formatCurrency(estimatedDailyCost)}</h2>
            </div>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            {isEditing && (
              <>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button type="button" variant="destructive" size="icon" title="Excluir RDO">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Excluir Relatório?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta ação não pode ser desfeita. O RDO será removido permanentemente do sistema.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                        Confirmar Exclusão
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialog>
                </AlertDialog>
                <Button type="button" variant="outline" onClick={handleExportPdf}>
                  <FileDown className="w-4 h-4 mr-2" /> PDF
                </Button>
              </>
            )}
            <Button type="submit" disabled={updateMutation.isPending || createMutation.isPending} className="flex-1 sm:flex-none">
              {(updateMutation.isPending || createMutation.isPending) ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Salvar RDO
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="data_rdo"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Data do Relatório</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {field.value ? format(field.value, "dd/MM/yyyy") : <span>Selecione a data</span>}
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="status_dia"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status do Dia</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {statusOptions.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="clima_condicoes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Clima / Condições</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value || undefined}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o clima" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {climaOptions.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Tabs defaultValue="atividades" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="atividades">Atividades</TabsTrigger>
            <TabsTrigger value="mao_de_obra">Mão de Obra</TabsTrigger>
            <TabsTrigger value="equipamentos">Equipamentos</TabsTrigger>
            <TabsTrigger value="ocorrencias">Ocorrências</TabsTrigger>
          </TabsList>
          
          <TabsContent value="atividades" className="pt-4">
            <RdoActivitiesForm obraId={obraId} />
          </TabsContent>
          
          <TabsContent value="mao_de_obra" className="pt-4">
            <RdoManpowerForm />
          </TabsContent>
          
          <TabsContent value="equipamentos" className="pt-4">
            <RdoEquipmentForm />
          </TabsContent>
          
          <TabsContent value="ocorrencias" className="pt-4 space-y-4">
            <FormField
              control={form.control}
              name="impedimentos_comentarios"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Impedimentos ou Paralisações</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      value={field.value || ""} 
                      placeholder="Descreva problemas com fornecedores, greves, falta de material..." 
                      rows={4} 
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="observacoes_gerais"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações Gerais</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      value={field.value || ""} 
                      placeholder="Outras informações relevantes do dia..." 
                      rows={4} 
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </TabsContent>
        </Tabs>
      </form>
    </Form>
  );
};

export default RdoForm;