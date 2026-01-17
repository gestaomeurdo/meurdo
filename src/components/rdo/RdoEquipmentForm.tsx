import { useFieldArray, useFormContext } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Search, DollarSign } from "lucide-react";
import { useMaquinas } from "@/hooks/use-maquinas";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency } from "@/utils/formatters";
import { Link } from "react-router-dom";

const RdoEquipmentForm = () => {
  const { control, setValue, watch, register } = useFormContext<any>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "equipamentos",
  });
  
  const { data: maquinas } = useMaquinas();
  const equipamentos = watch("equipamentos");

  const handleMachineSelect = (index: number, maquinaName: string) => {
    const maquina = maquinas?.find(m => m.nome === maquinaName);
    if (maquina) {
        setValue(`equipamentos.${index}.equipamento`, maquina.nome);
        setValue(`equipamentos.${index}.custo_hora`, maquina.custo_hora);
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

      {fields.map((field, index) => {
        const hours = equipamentos?.[index]?.horas_trabalhadas || 0;
        const costPerHour = equipamentos?.[index]?.custo_hora || 0;
        const subtotal = hours * costPerHour;

        return (
            <div key={field.id} className="p-4 border rounded-xl space-y-4 bg-secondary/5 relative group transition-all hover:border-primary/40 hover:shadow-sm">
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 text-destructive hover:bg-destructive/10 h-8 w-8"
                    onClick={() => remove(index)}
                    title="Remover Equipamento"
                >
                    <Trash2 className="w-4 h-4" />
                </Button>

                <div className="grid grid-cols-2 md:grid-cols-12 gap-3 items-end">
                    {/* Seletor - 6 Colunas (Expandido para cobrir a remoção da descrição) */}
                    <div className="col-span-2 md:col-span-6 space-y-1">
                        <Label className="text-[10px] font-black uppercase text-muted-foreground flex items-center gap-1">
                            <Search className="w-3 h-3" /> Máquina / Equipamento
                        </Label>
                        <Select 
                            value={equipamentos?.[index]?.equipamento} 
                            onValueChange={(val) => handleMachineSelect(index, val)}
                        >
                            <SelectTrigger className="bg-background rounded-xl border-muted-foreground/20 h-9 text-xs">
                                <SelectValue placeholder="Selecione do banco..." />
                            </SelectTrigger>
                            <SelectContent>
                                {maquinas?.map(m => (
                                    <SelectItem key={m.id} value={m.nome} className="text-xs">
                                        {m.nome} ({formatCurrency(m.custo_hora)}/h)
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    
                    {/* Horas Trabalhadas - 1.5 Colunas */}
                    <div className="col-span-1 md:col-span-1 space-y-1">
                        <Label className="text-[9px] md:text-[10px] font-black uppercase text-muted-foreground truncate" title="Horas Trabalhadas">
                            H. Trab.
                        </Label>
                        <Input
                            type="number"
                            placeholder="0.0"
                            step="0.5"
                            {...register(`equipamentos.${index}.horas_trabalhadas`, { valueAsNumber: true })}
                            min={0}
                            className="bg-background rounded-xl border-muted-foreground/20 h-9 text-center font-bold text-sm"
                        />
                    </div>

                    {/* Horas Paradas - 1.5 Colunas */}
                    <div className="col-span-1 md:col-span-1 space-y-1">
                        <Label className="text-[9px] md:text-[10px] font-black uppercase text-muted-foreground truncate" title="Horas Paradas">
                            H. Parada
                        </Label>
                        <Input
                            type="number"
                            placeholder="0.0"
                            step="0.5"
                            {...register(`equipamentos.${index}.horas_paradas`, { valueAsNumber: true })}
                            min={0}
                            className="bg-yellow-50 rounded-xl border-yellow-200 h-9 text-center text-sm"
                        />
                    </div>

                    {/* Custo Hora - 1.5 Colunas */}
                    <div className="col-span-1 md:col-span-2 space-y-1">
                        <Label className="text-[10px] font-black uppercase text-muted-foreground">R$/Hora</Label>
                        <Input
                            type="number"
                            step="0.01"
                            {...register(`equipamentos.${index}.custo_hora`, { valueAsNumber: true })}
                            className="bg-background rounded-xl border-muted-foreground/20 h-9 text-xs"
                            placeholder="0.00"
                        />
                    </div>

                    {/* Total - 1.5 Colunas */}
                    <div className="col-span-1 md:col-span-2 space-y-1">
                        <Label className="text-[10px] font-black uppercase text-primary">Subtotal</Label>
                        <div className="h-9 flex items-center justify-center px-2 bg-primary/10 border border-primary/20 rounded-xl font-black text-primary text-xs whitespace-nowrap overflow-hidden">
                            {formatCurrency(subtotal)}
                        </div>
                    </div>
                </div>
            </div>
        );
      })}
      
      <Button type="button" variant="outline" className="w-full border-dashed border-primary/40 py-6 rounded-2xl hover:bg-primary/5 hover:text-primary transition-all font-bold uppercase text-xs tracking-widest mt-4" onClick={() => append({ equipamento: "", horas_trabalhadas: 0, horas_paradas: 0, custo_hora: 0 })}>
        <Plus className="w-4 h-4 mr-2" /> Adicionar Equipamento
      </Button>
    </div>
  );
};

export default RdoEquipmentForm;