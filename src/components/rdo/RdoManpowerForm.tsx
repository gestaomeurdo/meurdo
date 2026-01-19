import { useFieldArray, useFormContext } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Calculator, Users, Search, StickyNote } from "lucide-react";
import { useCargos } from "@/hooks/use-cargos";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency } from "@/utils/formatters";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const RdoManpowerForm = () => {
  const { control, setValue, watch, register, formState: { errors } } = useFormContext<any>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "mao_de_obra",
  });
  const { data: cargos } = useCargos();
  const [showNoteMap, setShowNoteMap] = useState<Record<string, boolean>>({});

  const maoDeObra = watch("mao_de_obra");

  const handleCargoSelect = (index: number, cargoId: string) => {
    const cargo = cargos?.find(c => c.id === cargoId);
    if (cargo) {
      setValue(`mao_de_obra.${index}.funcao`, cargo.nome, { shouldValidate: true, shouldDirty: true });
      setValue(`mao_de_obra.${index}.custo_unitario`, Number(cargo.custo_diario) || 0, { shouldValidate: true, shouldDirty: true });
      setValue(`mao_de_obra.${index}.tipo`, cargo.tipo === 'Próprio' ? 'Própria' : 'Terceirizada', { shouldValidate: true, shouldDirty: true });
    }
  };

  const toggleNote = (id: string) => {
    setShowNoteMap(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center border-b pb-3 dark:border-slate-700">
        <h3 className="text-lg font-bold uppercase tracking-tight flex items-center gap-2 dark:text-slate-200">
          <Users className="w-5 h-5 text-primary" />
          Efetivo em Campo
        </h3>
        <div className="text-[10px] font-black text-muted-foreground uppercase flex items-center bg-accent dark:bg-slate-800 px-2 py-1 rounded-full">
          <Calculator className="w-3 h-3 mr-1 text-primary" />
          Custo Automático
        </div>
      </div>

      <div className="space-y-4">
        {fields.map((field, index) => {
          const qty = Number(maoDeObra?.[index]?.quantidade || 0);
          const price = Number(maoDeObra?.[index]?.custo_unitario || 0);
          const subtotal = qty * price;
          const type = maoDeObra?.[index]?.tipo;
          const showNote = showNoteMap[field.id] || !!maoDeObra?.[index]?.observacao;
          const fieldErrors = errors?.mao_de_obra?.[index];

          return (
            <div
              key={field.id}
              className={cn(
                "p-4 border rounded-2xl space-y-4 bg-slate-50/30 dark:bg-slate-900/50 shadow-sm relative group transition-all",
                fieldErrors ? "border-destructive/50 bg-destructive/5" : "border-border dark:border-slate-700"
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

              <div className="grid grid-cols-12 gap-3">
                <div className="col-span-12 sm:col-span-5 space-y-1.5">
                  <Label className={cn("text-[10px] font-black uppercase", fieldErrors?.funcao ? "text-destructive" : "text-muted-foreground")}>
                    Função <span className="text-red-500">*</span>
                  </Label>
                  {cargos && cargos.length > 0 ? (
                      <Select 
                          onValueChange={(val) => handleCargoSelect(index, val)}
                          defaultValue={cargos.find(c => c.nome === maoDeObra?.[index]?.funcao)?.id}
                      >
                          <SelectTrigger className={cn("w-full bg-white dark:bg-slate-950 h-10 border-transparent dark:border-slate-700 hover:border-input", fieldErrors?.funcao && "border-destructive ring-1 ring-destructive")}>
                              <SelectValue placeholder="Selecione a função..." />
                          </SelectTrigger>
                          <SelectContent className="dark:bg-slate-900">
                              {cargos.map(c => (
                                  <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                              ))}
                          </SelectContent>
                      </Select>
                  ) : (
                      <Input
                          {...register(`mao_de_obra.${index}.funcao`)}
                          placeholder="Ex: Pedreiro"
                          className={cn("bg-white dark:bg-slate-950 rounded-xl h-10", fieldErrors?.funcao && "border-destructive")}
                      />
                  )}
                </div>

                <div className="col-span-4 sm:col-span-2 space-y-1.5">
                  <Label className={cn("text-[10px] font-black uppercase block text-center", fieldErrors?.quantidade ? "text-destructive" : "text-muted-foreground")}>
                    Qtd
                  </Label>
                  <Input
                    type="number"
                    {...register(`mao_de_obra.${index}.quantidade`, { valueAsNumber: true })}
                    className={cn("bg-white dark:bg-slate-950 rounded-xl font-bold h-10 text-center border-transparent dark:border-slate-700 hover:border-input", fieldErrors?.quantidade && "border-destructive")}
                    min={0}
                  />
                </div>

                <div className="col-span-4 sm:col-span-3 space-y-1.5">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground block text-center">
                    Custo (R$)
                  </Label>
                  <Input
                    type="number"
                    step="0.01"
                    {...register(`mao_de_obra.${index}.custo_unitario`, { valueAsNumber: true })}
                    className="bg-white dark:bg-slate-950 rounded-xl h-10 text-center border-transparent dark:border-slate-700 hover:border-input"
                  />
                </div>

                <div className="col-span-4 sm:col-span-2 space-y-1.5">
                  <Label className="text-[10px] font-black uppercase text-primary dark:text-blue-400 block text-center">
                    Total
                  </Label>
                  <div className="h-10 flex items-center justify-center px-2 bg-primary/10 border border-primary/20 dark:border-blue-900/50 rounded-xl font-black text-primary dark:text-blue-400 text-xs whitespace-nowrap overflow-hidden">
                    {formatCurrency(subtotal)}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-dashed dark:border-slate-700 mt-2">
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">Vínculo:</span>
                    <Badge
                        variant={type === 'Própria' ? 'default' : 'outline'}
                        className="text-[10px] uppercase font-black tracking-widest px-3 py-1 cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => {
                            const newType = type === 'Própria' ? 'Terceirizada' : 'Própria';
                            setValue(`mao_de_obra.${index}.tipo`, newType);
                        }}
                    >
                    {type || 'Indefinido'}
                    </Badge>
                </div>
                
                <div className="flex items-center gap-2">
                    <Label htmlFor={`note-switch-${index}`} className="text-[10px] uppercase font-bold text-muted-foreground cursor-pointer">Nota</Label>
                    <Switch id={`note-switch-${index}`} checked={showNote} onCheckedChange={() => toggleNote(field.id)} />
                </div>
              </div>

              {showNote && (
                <div className="animate-in fade-in slide-in-from-top-1">
                    <Textarea 
                        placeholder="Observações sobre este profissional..." 
                        {...register(`mao_de_obra.${index}.observacao`)}
                        rows={1}
                        className="text-xs bg-white dark:bg-slate-950"
                    />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full border-dashed border-primary/40 dark:border-slate-700 py-6 rounded-2xl hover:bg-primary/5 hover:text-primary transition-all font-bold uppercase text-xs tracking-widest mt-4"
        onClick={() =>
          append({
            funcao: "",
            quantidade: 1,
            custo_unitario: 0,
            tipo: 'Própria',
          })
        }
      >
        <Plus className="w-4 h-4 mr-2" />
        Adicionar Profissional
      </Button>
    </div>
  );
};

export default RdoManpowerForm;