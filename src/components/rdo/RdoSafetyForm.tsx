"use client";

import { useFormContext } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Upload, Loader2, X } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";
import { compressImage } from "@/utils/image-compression";

const RdoSafetyForm = () => {
  const { control, register, setValue, watch } = useFormContext();
  const [uploadingField, setUploadingField] = useState<string | null>(null);

  const handleFileUpload = async (file: File, fieldName: string) => {
    if (!file) return;
    setUploadingField(fieldName);
    
    try {
      const compressedFile = await compressImage(file);
      const fileExt = compressedFile.name.split('.').pop();
      const fileName = `safety-${Date.now()}-${fieldName}.${fileExt}`;
      const filePath = `rdo_safety/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('documentos_financeiros')
        .upload(filePath, compressedFile);

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('documentos_financeiros')
        .getPublicUrl(filePath);

      setValue(fieldName, publicUrlData.publicUrl, { shouldDirty: true });
      showSuccess("Foto de segurança anexada!");
    } catch (error) {
      showError("Erro no upload.");
    } finally {
      setUploadingField(null);
    }
  };

  const safetyItems = [
    { id: "safety_nr35", label: "Trabalho em Altura (NR-35)", photoField: "safety_nr35_photo" },
    { id: "safety_epi", label: "Uso Obrigatório de EPIs", photoField: "safety_epi_photo" },
    { id: "safety_cleaning", label: "Organização e Limpeza", photoField: "safety_cleaning_photo" },
    { id: "safety_dds", label: "Diálogo Diário de Segurança (DDS)", photoField: "safety_dds_photo" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 border-b pb-2">
        <ShieldCheck className="w-5 h-5 text-green-600" />
        <h3 className="text-lg font-bold uppercase tracking-tight">Checklist de Segurança</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {safetyItems.map((item) => {
          const photoUrl = watch(item.photoField);
          return (
            <div key={item.id} className="p-4 border rounded-2xl bg-secondary/5 space-y-3">
              <FormField
                control={control}
                name={item.id}
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className="h-5 w-5"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-sm font-bold uppercase cursor-pointer">
                        {item.label}
                      </FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              <div className="flex items-center gap-2">
                <input
                  type="file"
                  id={item.photoField}
                  className="hidden"
                  accept="image/*"
                  onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], item.photoField)}
                />
                
                {photoUrl ? (
                  <div className="flex items-center gap-2 bg-white p-1 pr-3 rounded-lg border">
                    <img src={photoUrl} className="w-8 h-8 rounded object-cover" alt="Safety" />
                    <span className="text-[10px] font-bold text-green-600 uppercase">Anexado</span>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6 text-destructive"
                      onClick={() => setValue(item.photoField, null)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 text-[10px] font-bold uppercase border-dashed border-primary/30"
                    onClick={() => document.getElementById(item.photoField)?.click()}
                    disabled={uploadingField === item.photoField}
                  >
                    {uploadingField === item.photoField ? (
                      <Loader2 className="w-3 h-3 animate-spin mr-1" />
                    ) : (
                      <Upload className="w-3 h-3 mr-1" />
                    )}
                    Foto de Evidência
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-bold uppercase text-muted-foreground">Observações Técnicas de Segurança</Label>
        <Textarea 
          placeholder="Registre aqui diálogos de segurança, advertências ou observações sobre riscos..."
          {...register("safety_comments")}
          rows={3}
          className="bg-white rounded-xl"
        />
      </div>
    </div>
  );
};

export default RdoSafetyForm;