import { useFieldArray, useFormContext } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Search } from "lucide-react";
import { RdoInput } from "@/hooks/use-rdo";
import { useMaquinas } from "@/hooks/use-maquinas";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency } from "@/utils/formatters";
import { Link } from "react-router-dom";

const RdoEquipmentForm = () => {
  const { control, setValue } = useFormContext<RdoInput>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "equipamentos",
  });
  
  const { data: maquinas } = useMaquinas();

  const handleMachineSelect = (index: number, maquinaId: string) => {
    const maquina = maquinas?.find(m => m.id === maquinaId);
    if (maquina) {
        setValue(`equipamentos.${index}.equipamento`, maquina.nome);
        // We don't have cost in RDO Equipment schema yet, but we populate name for now
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold border-b pb-2">Equipamentos/Ferramentas</h3>
      
      {maquinas && maquinas.length === 0 && (
        <div className="text-center p-4 bg-yellow-50 border border-yellow-200 rounded-xl mb-4">
            <p className="text-xs text-yellow-800 mb-2">Nenhuma máquina cadastrada no banco.</p>
            <Button variant="outline" size="sm" className="h-8 text-xs" asChild>
                <Link to="/maquinas">Cadastrar Máquinas</Link>
            </Button>
        </div>
      )}

      {fields.map((field, index) => (
        <div key={field.id} className="p-4 border rounded-lg space-y-3 bg-secondary/10">
          <div className="flex justify-between items-start">
            <Label className="font-medium">Equipamento #{index + 1}</Label>
            <Button variant="ghost" size="icon" onClick={() => remove(index)} title="Remover Equipamento">
              <Trash2 className="w-4 h-4 text-destructive" />
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-muted-foreground flex items-center gap-1">
                 <Search className="w-3 h-3" /> Selecionar Máquina
              </Label>
              <Select onValueChange={(val) => handleMachineSelect(index, val)}>
                <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Escolher..." />
                </SelectTrigger>
                <SelectContent>
                    {maquinas?.map(m => (
                        <SelectItem key={m.id} value={m.id}>
                            {m.nome} ({formatCurrency(m.custo_hora)}/h)
                        </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <Label htmlFor={`equipamento-${index}`}>Nome do Equipamento</Label>
              <Input
                id={`equipamento-${index}`}
                placeholder="Ex: Betoneira, Escavadeira"
                {...control.register(`equipamentos.${index}.equipamento`)}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor={`horas_trabalhadas-${index}`}>Horas Trabalhadas</Label>
              <Input
                id={`horas_trabalhadas-${index}`}
                type="number"
                placeholder="0.0"
                step="0.1"
                {...control.register(`equipamentos.${index}.horas_trabalhadas`, { valueAsNumber: true })}
                min={0}
              />
            </div>
            <div>
              <Label htmlFor={`horas_paradas-${index}`}>Horas Paradas</Label>
              <Input
                id={`horas_paradas-${index}`}
                type="number"
                placeholder="0.0"
                step="0.1"
                {...control.register(`equipamentos.${index}.horas_paradas`, { valueAsNumber: true })}
                min={0}
              />
            </div>
          </div>
        </div>
      ))}
      <Button type="button" variant="outline" onClick={() => append({ equipamento: "", horas_trabalhadas: 0, horas_paradas: 0 })}>
        <Plus className="w-4 h-4 mr-2" /> Adicionar Equipamento
      </Button>
    </div>
  );
};

export default RdoEquipmentForm;