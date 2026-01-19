import { useFieldArray, useFormContext } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Upload, Loader2, Image as ImageIcon, CheckSquare, X, ListTodo, TrendingUp } from "lucide-react";
import { RdoInput } from "@/hooks/use-rdo";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";
import { cn } from "@/lib/utils";
import { useAtividades } from "@/hooks/use-atividades";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { compressImage } from "@/utils/image-compression";

interface RdoActivitiesFormProps {
  obraId: string;
}

const RdoActivitiesForm = ({ obraId }: RdoActivitiesFormProps) => {
  const { control, watch, setValue, register, formState: { errors } } = useFormContext<RdoInput>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "atividades",
  });

  const { data: atividadesCronograma } = useAtividades(obraId);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);

  const handleFileUpload = async (file: File, index: number) => {
    if (!file) return;
    setUploadingIndex(index);
    
    try {
      // Compressing image before upload
      const compressedFile = await compressImage(file);
      
      const fileExt = compressedFile.name.split('.').pop();
      const fileName = `${Date.now()}-${index}.${fileExt}`;
      const filePath = `rdo_atividades/${obraId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('documentos_financeiros')
        .upload(filePath, compressedFile);

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('documentos_financeiros')
        .getPublicUrl(filePath);

      setValue(`atividades.${index}.foto_anexo_url`, publicUrlData.publicUrl, { shouldDirty: true });
      showSuccess("Foto comprimida e anexada!");
    } catch (error) {
      console.error(error);
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
      <div className="flex items-center justify-between border-b pb-2">
        <h3 className="text-lg font-semibold">Serviços do Dia</h3>
        <p className="text-xs text-muted-foreground flex items-center">
            <CheckSquare className="w-3 h-3 mr-1 text-primary" />
            Vincule atividades do cronograma.
        </p>
      </div>

      {fields.map((field, index) => {
        const photoUrl = watch(`atividades.${index}.foto_anexo_url`);
        const currentDesc = watch(`atividades.${index}.descricao_servico`);
        const currentProgress = watch(`atividades.${index}.avanco_percentual`) || 0;
        const fieldErrors = (errors as any)?.atividades?.[index];

        // Find linked activity to show previous progress
        const linkedActivity = atividadesCronograma?.find(a => a.descricao === currentDesc);
        const baseProgress = linkedActivity?.progresso_atual || 0;

        return (
          <div key={field.id} className={cn("p-4 border rounded-xl space-y-4 bg-secondary/5", fieldErrors ? "border-destructive/50 bg-destructive/5" : "")}>
            <div className="flex justify-between items-start">
              <Label className={cn("text-xs font-black uppercase tracking-widest", fieldErrors ? "text-destructive" : "text-primary")}>
                Atividade #{index + 1}
              </Label>
              <Button variant="ghost" size="icon" onClick={() => remove(index)} className="h-6 w-6 text-destructive">
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-8 space-y-2">
                <Label className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                    <ListTodo className="w-3 h-3" /> Selecionar do Cronograma
                </Label>
                
                {atividadesCronograma && atividadesCronograma.length > 0 ? (
                    <Select 
                        value={currentDesc} 
                        onValueChange={(val) => handleSelectActivity(index, val)}
                    >
                        <SelectTrigger className="bg-white h-10 text-sm border-primary/20 focus:ring-primary/20">
                            <SelectValue placeholder="Selecione uma atividade..." />
                        </SelectTrigger>
                        <SelectContent>
                            {atividadesCronograma.map(atv => (
                                <SelectItem key={atv.id} value={atv.descricao} className="text-xs">
                                    <div className="flex justify-between w-full gap-4">
                                        <span>{atv.descricao}</span>
                                        <span className="text-muted-foreground">{atv.progresso_atual}%</span>
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                ) : (
                    <Input 
                        placeholder="Digite a descrição (Nenhuma atividade cadastrada)"
                        {...register(`atividades.${index}.descricao_servico`)}
                        className="bg-background"
                    />
                )}

                <div className="mt-2">
                    <Label className="text-[10px] uppercase font-bold text-muted-foreground">Nota / Observação (Opcional)</Label>
                    <Textarea
                        placeholder="Detalhes do que foi feito hoje..."
                        {...register(`atividades.${index}.observacao`)}
                        rows={1}
                        className="bg-background mt-1"
                    />
                </div>
              </div>

              <div className="md:col-span-4 space-y-2">
                <Label className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" /> Avanço Físico Total
                </Label>
                
                <div className="bg-white p-3 rounded-xl border border-input space-y-3">
                    <div className="flex justify-between items-center">
                        <span className="text-xs font-medium text-muted-foreground">Anterior: {baseProgress}%</span>
                        <span className="text-lg font-black text-primary">{currentProgress}%</span>
                    </div>
                    
                    <Progress value={currentProgress} className="h-2 bg-primary/20" />
                    
                    <div className="flex items-center gap-2">
                        <Input
                            type="range"
                            min="0"
                            max="100"
                            step="5"
                            {...register(`atividades.${index}.avanco_percentual`, { valueAsNumber: true })}
                            className="h-6 p-0 bg-transparent border-0 cursor-pointer accent-[#066abc]"
                        />
                    </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
                <Label htmlFor={`foto-${index}`} className={cn(
                    "flex items-center justify-center px-4 py-2 border rounded-xl cursor-pointer transition-all text-xs font-bold uppercase tracking-wider h-10",
                    uploadingIndex === index ? "bg-muted cursor-not-allowed" : "hover:bg-accent border-dashed border-primary/30 text-primary"
                )}>
                    {uploadingIndex === index ? <Loader2 className="w-3 h-3 mr-2 animate-spin" /> : <Upload className="w-3 h-3 mr-2" />}
                    {photoUrl ? "Alterar Anexo" : "Anexar Foto"}
                </Label>
                <Input
                    id={`foto-${index}`}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], index)}
                />

                {photoUrl && (
                    <div className="flex items-center gap-2">
                        <a href={photoUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-primary hover:underline flex items-center">
                            <ImageIcon className="w-3 h-3 mr-1" /> Ver Foto
                        </a>
                        <Button variant="ghost" size="icon" onClick={() => setValue(`atividades.${index}.foto_anexo_url`, null)} className="h-6 w-6 text-destructive"><X className="w-3 h-3" /></Button>
                    </div>
                )}
            </div>
          </div>
        );
      })}
      
      <Button type="button" variant="outline" className="w-full border-dashed py-6" onClick={() => append({ descricao_servico: "", avanco_percentual: 0, foto_anexo_url: null, observacao: "" })}>
        <Plus className="w-4 h-4 mr-2" /> Adicionar Serviço
      </Button>
    </div>
  );
};

export default RdoActivitiesForm;