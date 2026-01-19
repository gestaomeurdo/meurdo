import { useFieldArray, useFormContext } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Search, DollarSign, Camera, StickyNote, Loader2, Image as ImageIcon, X } from "lucide-react";
import { useMaquinas } from "@/hooks/use-maquinas";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency } from "@/utils/formatters";
import { Link } from "react-router-dom";
import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";
import { cn } from "@/lib/utils";
import { compressImage } from "@/utils/image-compression";

const RdoEquipmentForm = () => {
  const { control, setValue, watch, register, formState: { errors } } = useFormContext<any>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "equipamentos",
  });
  
  const { data: maquinas } = useMaquinas();
  const equipamentos = watch("equipamentos");
  const [extraFieldsMap, setExtraFieldsMap] = useState<Record<string, { note: boolean, photo: boolean }>>({});
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);

  const handleMachineSelect = (index: number, maquinaName: string) => {
    const maquina = maquinas?.find(m => m.nome === maquinaName);
    if (maquina) {
        setValue(`equipamentos.${index}.equipamento`, maquina.nome, { shouldValidate: true });
        setValue(`equipamentos.${index}.custo_hora`, maquina.custo_hora);
    }
  };

  const toggleExtra = (id: string, type: 'note' | 'photo') => {
    setExtraFieldsMap(prev => ({
        ...prev,
        [id]: { ...prev[id], [type]: !prev[id]?.[type] }
    }));
  };

  const handleFileUpload = async (file: File, index: number) => {
    if (!file) return;
    setUploadingIndex(index);
    
    try {
      const compressedFile = await compressImage(file);
      
      const fileExt = compressedFile.name.split('.').pop();
      const fileName = `equip-${Date.now()}-${index}.${fileExt}`;
      const filePath = `rdo_equipamentos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('documentos_financeiros')
        .upload(filePath, compressedFile);

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('documentos_financeiros')
        .getPublicUrl(filePath);

      setValue(`equipamentos.${index}.foto_url`, publicUrlData.publicUrl, { shouldDirty: true });
      showSuccess("Foto anexada!");
    } catch (error) {
      showError("Erro no upload.");
    } finally {
      setUploadingIndex(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center border-b pb-2">
        <h3 className="text-lg font-semibold">Equipamentos/Ferramentas</h3>
        <div className="text-xs font-medium text-muted-foreground flex items-center bg-accent px-2 py-1 rounded-full">
            <DollarSign className="w-3 h-3 mr-1 text-primary" />
            Custo Calculado
        </div>
      </div>
      
      {maquinas && maquinas.length === 0 && (
        <div className="text-center p-4 bg-yellow-50 border border-yellow-200 rounded-xl mb-4">
            <p className="text-xs text-yellow-800 mb-2">Nenhuma máquina cadastrada no banco.</p>
            <Button variant="outline" size="sm" className="h-8 text-xs" asChild>
                <Link to="/maquinas">Cadastrar Máquinas</Link>
            </Button>
        </div>
      )}

      <div className="space-y-4">
        {fields.map((field, index) => {
            const hours = equipamentos?.[index]?.horas_trabalhadas || 0;
            const costPerHour = equipamentos?.[index]?.custo_hora || 0;
            const subtotal = hours * costPerHour;
            const hasPhoto = !!equipamentos?.[index]?.foto_url;
            
            const showNote = extraFieldsMap[field.id]?.note || !!equipamentos?.[index]?.observacao;
            const showPhoto = extraFieldsMap[field.id]?.photo || hasPhoto;
            const fieldErrors = errors?.equipamentos?.[index];

            return (
                <div 
                    key={field.id} 
                    className={cn(
                        "p-4 border rounded-2xl bg-white shadow-sm space-y-4 relative group",
                        fieldErrors ? "border-destructive/50 bg-destructive/5" : "border-border"
                    )}
                >
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 text-destructive hover:bg-destructive/10 h-8 w-8"
                        onClick={() => remove(index)}
                    >
                        <Trash2 className="w-4 h-4" />
                    </Button>

                    <div className="pr-10">
                        <Label className={cn("text-[10px] font-black uppercase flex items-center gap-1 mb-1.5", fieldErrors?.equipamento ? "text-destructive" : "text-muted-foreground")}>
                            <Search className="w-3 h-3" /> Máquina / Equipamento
                        </Label>
                        <div className="flex gap-2">
                            {maquinas && maquinas.length > 0 && (
                                <Select 
                                    value={equipamentos?.[index]?.equipamento} 
                                    onValueChange={(val) => handleMachineSelect(index, val)}
                                >
                                    <SelectTrigger className={cn("bg-secondary/20 rounded-xl border-transparent hover:border-border h-10 text-xs w-1/3 min-w-[120px]", fieldErrors?.equipamento && "border-destructive")}>
                                        <SelectValue placeholder="Selecione..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {maquinas?.map(m => (
                                            <SelectItem key={m.id} value={m.nome} className="text-xs">
                                                {m.nome} ({formatCurrency(m.custo_hora)}/h)
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                            <Input
                                placeholder={maquinas && maquinas.length > 0 ? "Ou digite..." : "Nome do equipamento..."}
                                {...register(`equipamentos.${index}.equipamento`)}
                                className={cn("bg-secondary/10 rounded-xl h-10 border-transparent hover:border-input focus:bg-background transition-all flex-1 text-sm", fieldErrors?.equipamento && "border-destructive")}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-black uppercase text-muted-foreground block text-center">H. Trab</Label>
                            <Input
                                type="number"
                                placeholder="0.0"
                                step="0.5"
                                {...register(`equipamentos.${index}.horas_trabalhadas`, { valueAsNumber: true })}
                                min={0}
                                className="bg-secondary/10 rounded-xl h-10 text-center font-bold text-sm border-transparent hover:border-input"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-black uppercase text-muted-foreground block text-center">H. Paradas</Label>
                            <Input
                                type="number"
                                placeholder="0.0"
                                step="0.5"
                                {...register(`equipamentos.${index}.horas_paradas`, { valueAsNumber: true })}
                                min={0}
                                className="bg-yellow-50 rounded-xl border-yellow-200 h-10 text-center text-sm"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-black uppercase text-muted-foreground block text-center">R$/Hora</Label>
                            <Input
                                type="number"
                                step="0.01"
                                {...register(`equipamentos.${index}.custo_hora`, { valueAsNumber: true })}
                                className="bg-secondary/10 rounded-xl h-10 text-center text-xs border-transparent hover:border-input"
                                placeholder="0.00"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-black uppercase text-primary block text-center">Subtotal</Label>
                            <div className="h-10 flex items-center justify-center px-2 bg-primary/10 border border-primary/20 rounded-xl font-black text-primary text-xs whitespace-nowrap overflow-hidden">
                                {formatCurrency(subtotal)}
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-4 pt-2 border-t border-dashed">
                        <div className="flex items-center gap-2">
                            <Switch id={`note-${index}`} checked={showNote} onCheckedChange={() => toggleExtra(field.id, 'note')} />
                            <Label htmlFor={`note-${index}`} className="text-[10px] font-bold uppercase text-muted-foreground cursor-pointer flex items-center gap-1"><StickyNote className="w-3 h-3" /> Nota</Label>
                        </div>
                        <div className="flex items-center gap-2">
                            <Switch id={`photo-${index}`} checked={showPhoto} onCheckedChange={() => toggleExtra(field.id, 'photo')} />
                            <Label htmlFor={`photo-${index}`} className="text-[10px] font-bold uppercase text-muted-foreground cursor-pointer flex items-center gap-1"><Camera className="w-3 h-3" /> Foto</Label>
                        </div>
                    </div>

                    {showNote && (
                        <Textarea placeholder="Observação sobre o uso..." {...register(`equipamentos.${index}.observacao`)} rows={1} className="text-xs bg-muted/30" />
                    )}

                    {showPhoto && (
                        <div className="flex items-center gap-3 bg-muted/20 p-2 rounded-lg">
                             <Input
                                id={`equip-file-${index}`}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], index)}
                                disabled={uploadingIndex === index}
                            />
                            <Button 
                                type="button" 
                                variant="outline" 
                                size="sm" 
                                className="h-8 text-xs" 
                                onClick={() => document.getElementById(`equip-file-${index}`)?.click()}
                                disabled={uploadingIndex === index}
                            >
                                {uploadingIndex === index ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : <Camera className="w-3 h-3 mr-2" />}
                                {hasPhoto ? "Trocar Foto" : "Anexar Foto"}
                            </Button>
                            {hasPhoto && (
                                <div className="flex items-center gap-2">
                                    <a href={equipamentos[index].foto_url} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-primary hover:underline flex items-center">
                                        <ImageIcon className="w-3 h-3 mr-1" /> Ver
                                    </a>
                                    <Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => setValue(`equipamentos.${index}.foto_url`, null)}><X className="w-3 h-3" /></Button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            );
        })}
      </div>
      
      <Button type="button" variant="outline" className="w-full border-dashed border-primary/40 py-6 rounded-2xl hover:bg-primary/5 hover:text-primary transition-all font-bold uppercase text-xs tracking-widest mt-4" onClick={() => append({ equipamento: "", horas_trabalhadas: 0, horas_paradas: 0, custo_hora: 0 })}>
        <Plus className="w-4 h-4 mr-2" /> Adicionar Equipamento
      </Button>
    </div>
  );
};

export default RdoEquipmentForm;