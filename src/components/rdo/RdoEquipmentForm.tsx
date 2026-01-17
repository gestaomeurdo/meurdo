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

      <div className="space-y-4">
        {fields.map((field, index) => {
            const hours = equipamentos?.[index]?.horas_trabalhadas || 0;
            const costPerHour = equipamentos?.[index]?.custo_hora || 0;
            const subtotal = hours * costPerHour;

            return (
                <div key={field.id} className="p-4 border rounded-2xl bg-white shadow-sm space-y-4 relative group">
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

                    <div className="pr-10">
                        <Label className="text-[10px] font-black uppercase text-muted-foreground flex items-center gap-1 mb-1.5">
                            <Search className="w-3 h-3" /> Máquina / Equipamento
                        </Label>
                        <div className="flex gap-2">
                            <Select 
                                value={equipamentos?.[index]?.equipamento} 
                                onValueChange={(val) => handleMachineSelect(index, val)}
                            >
                                <SelectTrigger className="bg-secondary/20 rounded-xl border-transparent hover:border-border h-10 text-xs w-1/3 min-w-[120px]">
                                    <SelectValue placeholder="Buscar..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {maquinas?.map(m => (
                                        <SelectItem key={m.id} value={m.nome} className="text-xs">
                                            {m.nome} ({formatCurrency(m.custo_hora)}/h)
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Input
                                placeholder="Ou digite o nome do equipamento..."
                                {...register(`equipamentos.${index}.equipamento`)}
                                className="bg-secondary/10 rounded-xl h-10 border-transparent hover:border-input focus:bg-background transition-all flex-1 text-sm"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {/* Horas Trabalhadas */}
                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-black uppercase text-muted-foreground block text-center" title="Horas Trabalhadas">
                                H. Trabalhadas
                            </Label>
                            <Input
                                type="number"
                                placeholder="0.0"
                                step="0.5"
                                {...register(`equipamentos.${index}.horas_trabalhadas`, { valueAsNumber: true })}
                                min={0}
                                className="bg-secondary/10 rounded-xl h-10 text-center font-bold text-sm border-transparent hover:border-input"
                            />
                        </div>

                        {/* Horas Paradas */}
                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-black uppercase text-muted-foreground block text-center" title="Horas Paradas">
                                H. Paradas
                            </Label>
                            <Input
                                type="number"
                                placeholder="0.0"
                                step="0.5"
                                {...register(`equipamentos.${index}.horas_paradas`, { valueAsNumber: true })}
                                min={0}
                                className="bg-yellow-50 rounded-xl border-yellow-200 h-10 text-center text-sm"
                            />
                        </div>

                        {/* Custo Hora */}
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

                        {/* Total */}
                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-black uppercase text-primary block text-center">Subtotal</Label>
                            <div className="h-10 flex items-center justify-center px-2 bg-primary/10 border border-primary/20 rounded-xl font-black text-primary text-xs whitespace-nowrap overflow-hidden">
                                {formatCurrency(subtotal)}
                            </div>
                        </div>
                    </div>
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