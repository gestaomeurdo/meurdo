import { useFieldArray, useFormContext } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Upload, Loader2, Image as ImageIcon } from "lucide-react";
import { RdoInput } from "@/hooks/use-rdo";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { showError } from "@/utils/toast";
import { cn } from "@/lib/utils";

interface RdoActivitiesFormProps {
  obraId: string;
}

const RdoActivitiesForm = ({ obraId }: RdoActivitiesFormProps) => {
  const { control, watch, setValue } = useFormContext<RdoInput>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "atividades",
  });
  
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);

  const handleFileUpload = async (file: File, index: number) => {
    if (!file) return;

    setUploadingIndex(index);
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${index}.${fileExt}`;
    const filePath = `rdo_atividades/${obraId}/${fileName}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from('documentos_financeiros') // Reusing the existing bucket for now
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data: publicUrlData } = supabase.storage
        .from('documentos_financeiros')
        .getPublicUrl(filePath);

      setValue(`atividades.${index}.foto_anexo_url`, publicUrlData.publicUrl, { shouldDirty: true });
    } catch (error) {
      showError("Erro ao fazer upload da foto.");
      console.error("Upload error:", error);
    } finally {
      setUploadingIndex(null);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold border-b pb-2">Atividades Realizadas</h3>
      {fields.map((field, index) => (
        <div key={field.id} className="p-4 border rounded-lg space-y-3 bg-secondary/10">
          <div className="flex justify-between items-start">
            <Label className="font-medium">Atividade #{index + 1}</Label>
            <Button variant="ghost" size="icon" onClick={() => remove(index)} title="Remover Atividade">
              <Trash2 className="w-4 h-4 text-destructive" />
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2">
              <Label htmlFor={`descricao-${index}`}>Descrição do Serviço</Label>
              <Textarea
                id={`descricao-${index}`}
                placeholder="Ex: Assentamento de 50m² de piso cerâmico"
                {...control.register(`atividades.${index}.descricao_servico`)}
                rows={2}
              />
            </div>
            <div>
              <Label htmlFor={`avanco-${index}`}>Avanço (%)</Label>
              <Input
                id={`avanco-${index}`}
                type="number"
                placeholder="0-100"
                {...control.register(`atividades.${index}.avanco_percentual`, { valueAsNumber: true })}
                min={0}
                max={100}
              />
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Label htmlFor={`foto-${index}`} className={cn(
                "flex items-center justify-center p-2 border rounded-md cursor-pointer transition-colors text-sm",
                uploadingIndex === index ? "bg-muted cursor-not-allowed" : "hover:bg-accent"
            )}>
                {uploadingIndex === index ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                    <Upload className="w-4 h-4 mr-2" />
                )}
                {uploadingIndex === index ? "Enviando..." : "Anexar Foto"}
            </Label>
            <Input
                id={`foto-${index}`}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                    if (e.target.files?.[0]) {
                        handleFileUpload(e.target.files[0], index);
                    }
                }}
                disabled={uploadingIndex === index}
            />
            {watch(`atividades.${index}.foto_anexo_url`) && (
                <a 
                    href={watch(`atividades.${index}.foto_anexo_url`) || '#'} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-sm text-primary hover:underline flex items-center"
                >
                    <ImageIcon className="w-4 h-4 mr-1" />
                    Ver Foto Anexada
                </a>
            )}
          </div>
        </div>
      ))}
      <Button type="button" variant="outline" onClick={() => append({ descricao_servico: "", avanco_percentual: 0, foto_anexo_url: null })}>
        <Plus className="w-4 h-4 mr-2" /> Adicionar Atividade
      </Button>
    </div>
  );
};

export default RdoActivitiesForm;