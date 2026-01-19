"use client";

import { useFieldArray, useFormContext } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Upload, Loader2, Image as ImageIcon, CheckSquare, X, ListTodo, TrendingUp, Zap } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";
import { cn } from "@/lib/utils";
import { useAtividades } from "@/hooks/use-atividades";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { compressImage } from "@/utils/image-compression";
import { useAuth } from "@/integrations/supabase/auth-provider";
import UpgradeModal from "../subscription/UpgradeModal";

interface RdoActivitiesFormProps {
  obraId: string;
}

const RdoActivitiesForm = ({ obraId }: RdoActivitiesFormProps) => {
  const { isPro } = useAuth();
  const { control, watch, setValue, register, formState: { errors } } = useFormContext<any>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "atividades",
  });

  const { data: atividadesCronograma } = useAtividades(obraId);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const [showUpgrade, setShowUpgrade] = useState(false);

  const activities = watch("atividades") || [];
  const photosCount = activities.filter((a: any) => !!a.foto_anexo_url).length;

  const handleFileUpload = async (file: File, index: number) => {
    if (!file) return;

    // Lógica de limite de fotos para Plano Free
    if (!isPro && !activities[index].foto_anexo_url && photosCount >= 5) {
        setShowUpgrade(true);
        return;
    }

    setUploadingIndex(index);
    try {
      const compressedFile = await compressImage(file);
      const fileExt = compressedFile.name.split('.').pop();
      const fileName = `rdo-${obraId}-${Date.now()}-${index}.${fileExt}`;
      const filePath = `rdo_atividades/${obraId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('documentos_financeiros')
        .upload(filePath, compressedFile);

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('documentos_financeiros')
        .getPublicUrl(filePath);

      setValue(`atividades.${index}.foto_anexo_url`, publicUrlData.publicUrl, { shouldDirty: true });
      showSuccess("Foto anexada!");
    } catch (error) {
      showError("Erro no upload.");
    } finally {
      setUploadingIndex(null);
    }
  };

  const handleSelectActivity = (index: number, value: string) => {
    const activity = atividadesCronograma?.find(a => a.descricao === value);
    if (activity) {
        setValue(`atividades.${index}.descricao_servico`, activity.descricao, { shouldValidate: true, shouldDirty: true });
        setValue(`atividades.${index}.avanco_percentual`, activity.progresso_atual || 0, { shouldDirty: true });
    }
  };

  return (
    <div className="space-y-4">
      <UpgradeModal open={showUpgrade} onOpenChange={setShowUpgrade} title="Limite de Fotos Atingido" description="No plano gratuito você pode anexar até 5 fotos por RDO. Faça upgrade para histórico fotográfico ilimitado." />
      
      <div className="flex items-center justify-between border-b pb-2 dark:border-slate-700">
        <h3 className="text-lg font-semibold dark:text-slate-200">Serviços do Dia</h3>
        {!isPro && (
            <Badge variant="outline" className="text-[10px] font-black border-orange-200 text-orange-600 bg-orange-50 dark:bg-orange-950/20">
                <Zap className="w-3 h-3 mr-1 fill-current" /> {photosCount}/5 Fotos
            </Badge>
        )}
      </div>

      {fields.map((field, index) => {
        const photoUrl = watch(`atividades.${index}.foto_anexo_url`);
        const currentDesc = watch(`atividades.${index}.descricao_servico`);
        const currentProgress = watch(`atividades.${index}.avanco_percentual`) || 0;
        const fieldErrors = (errors as any)?.atividades?.[index];

        return (
          <div key={field.id} className={cn("p-4 border rounded-xl space-y-4 bg-slate-50/50 dark:bg-slate-900/50 dark:border-slate-700", fieldErrors ? "border-destructive/50 bg-destructive/5" : "")}>
            <div className="flex justify-between items-start">
              <Label className={cn("text-[10px] font-black uppercase tracking-widest", fieldErrors ? "text-destructive" : "text-primary")}>
                Atividade #{index + 1}
              </Label>
              <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="h-6 w-6 text-destructive">
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-8 space-y-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground">Vincular Serviço</Label>
                {atividadesCronograma && atividadesCronograma.length > 0 ? (
                    <Select value={currentDesc} onValueChange={(val) => handleSelectActivity(index, val)}>
                        <SelectTrigger className="bg-white dark:bg-slate-950 h-10 text-sm"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                        <SelectContent>
                            {atividadesCronograma.map(atv => (
                                <SelectItem key={atv.id} value={atv.descricao} className="text-xs">
                                    <div className="flex justify-between w-full gap-4"><span>{atv.descricao}</span><span className="text-muted-foreground">{atv.progresso_atual}%</span></div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                ) : (
                    <Input placeholder="Descreva o serviço..." {...register(`atividades.${index}.descricao_servico`)} />
                )}
                <Textarea placeholder="O que foi feito hoje?" {...register(`atividades.${index}.observacao`)} rows={1} className="mt-2" />
              </div>

              <div className="md:col-span-4 space-y-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground">Progresso Total: {currentProgress}%</Label>
                <div className="bg-white dark:bg-slate-950 p-3 rounded-xl border border-input space-y-3">
                    <Progress value={currentProgress} className="h-2" />
                    <Input type="range" min="0" max="100" step="5" {...register(`atividades.${index}.avanco_percentual`, { valueAsNumber: true })} className="h-6 p-0 bg-transparent border-0 cursor-pointer accent-[#066abc]" />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
                <Label htmlFor={`foto-${index}`} className={cn(
                    "flex items-center justify-center px-4 py-2 border rounded-xl cursor-pointer transition-all text-xs font-bold uppercase tracking-wider h-10",
                    uploadingIndex === index ? "bg-muted cursor-not-allowed" : "hover:bg-accent border-dashed border-primary/30 text-primary"
                )}>
                    {uploadingIndex === index ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : <Upload className="w-3 h-3 mr-2" />}
                    {photoUrl ? "Alterar Foto" : "Anexar Foto"}
                </Label>
                <Input id={`foto-${index}`} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], index)} />
                {photoUrl && (
                    <div className="flex items-center gap-2">
                        <a href={photoUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-primary hover:underline flex items-center"><ImageIcon className="w-3 h-3 mr-1" /> Ver</a>
                        <Button type="button" variant="ghost" size="icon" onClick={() => setValue(`atividades.${index}.foto_anexo_url`, null)} className="h-6 w-6 text-destructive"><X className="w-3 h-3" /></Button>
                    </div>
                )}
            </div>
          </div>
        );
      })}
      
      <Button type="button" variant="outline" className="w-full border-dashed py-6 rounded-2xl" onClick={() => append({ descricao_servico: "", avanco_percentual: 0, foto_anexo_url: null, observacao: "" })}>
        <Plus className="w-4 h-4 mr-2" /> Adicionar Atividade
      </Button>
    </div>
  );
};

export default RdoActivitiesForm;