import { useFieldArray, useFormContext } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Upload, Loader2, Image as ImageIcon, FileText, X, CheckSquare } from "lucide-react";
import { RdoInput } from "@/hooks/use-rdo";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";
import { cn } from "@/lib/utils";
import { useAtividades } from "@/hooks/use-atividades";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface RdoActivitiesFormProps {
  obraId: string;
}

const RdoActivitiesForm = ({ obraId }: RdoActivitiesFormProps) => {
  const { control, watch, setValue } = useFormContext<RdoInput>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "atividades",
  });

  const { data: atividadesCronograma } = useAtividades(obraId);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);

  const handleFileUpload = async (file: File, index: number) => {
    if (!file) return;
    setUploadingIndex(index);
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${index}.${fileExt}`;
    const filePath = `rdo_atividades/${obraId}/${fileName}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from('documentos_financeiros')
        .upload(filePath, file);

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
    setValue(`atividades.${index}.descricao_servico`, value);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b pb-2">
        <h3 className="text-lg font-semibold">Serviços do Dia</h3>
        <p className="text-xs text-muted-foreground flex items-center">
            <CheckSquare className="w-3 h-3 mr-1 text-primary" />
            Vincule atividades do cronograma para registrar o avanço.
        </p>
      </div>

      {fields.map((field, index) => {
        const photoUrl = watch(`atividades.${index}.foto_anexo_url`);
        const isImage = photoUrl && photoUrl.match(/\.(jpeg|jpg|png|gif)$/i);

        return (
          <div key={field.id} className="p-4 border rounded-xl space-y-4 bg-secondary/5">
            <div className="flex justify-between items-start">
              <Label className="text-xs font-black uppercase text-primary tracking-widest">Atividade #{index + 1}</Label>
              <Button variant="ghost" size="icon" onClick={() => remove(index)} className="h-6 w-6 text-destructive">
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-8 space-y-2">
                <Label className="text-[10px] uppercase font-bold text-muted-foreground">O que foi trabalhado?</Label>
                {atividadesCronograma && atividadesCronograma.length > 0 ? (
                    <Select onValueChange={(val) => handleSelectActivity(index, val)}>
                        <SelectTrigger className="bg-background">
                            <SelectValue placeholder="Selecione do cronograma ou descreva..." />
                        </SelectTrigger>
                        <SelectContent>
                            {atividadesCronograma.map(atv => (
                                <SelectItem key={atv.id} value={atv.descricao}>
                                    {atv.descricao} ({atv.etapa})
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                ) : null}
                <Textarea
                  placeholder="Detalhes adicionais sobre o serviço..."
                  {...control.register(`atividades.${index}.descricao_servico`)}
                  rows={2}
                  className="bg-background mt-2"
                />
              </div>
              <div className="md:col-span-4">
                <Label className="text-[10px] uppercase font-bold text-muted-foreground">Avanço Físico (%)</Label>
                <div className="flex items-center gap-2">
                    <Input
                        type="number"
                        placeholder="0-100"
                        {...control.register(`atividades.${index}.avanco_percentual`, { valueAsNumber: true })}
                        className="bg-background text-lg font-bold text-primary"
                        min={0}
                        max={100}
                    />
                    <span className="font-bold text-lg text-primary">%</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
                <Label htmlFor={`foto-${index}`} className={cn(
                    "flex items-center justify-center px-4 py-2 border rounded-xl cursor-pointer transition-all text-xs font-bold uppercase tracking-wider",
                    uploadingIndex === index ? "bg-muted cursor-not-allowed" : "hover:bg-accent border-dashed border-primary/30 text-primary"
                )}>
                    {uploadingIndex === index ? <Loader2 className="w-3 h-3 mr-2 animate-spin" /> : <Upload className="w-3 h-3 mr-2" />}
                    {photoUrl ? "Alterar Anexo" : "Anexar Foto"}
                </Label>
                <Input
                    id={`foto-${index}`}
                    type="file"
                    accept="image/*,application/pdf"
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
      
      <Button type="button" variant="outline" className="w-full border-dashed py-6" onClick={() => append({ descricao_servico: "", avanco_percentual: 0, foto_anexo_url: null })}>
        <Plus className="w-4 h-4 mr-2" /> Registrar Novo Serviço no Dia
      </Button>
    </div>
  );
};

export default RdoActivitiesForm;