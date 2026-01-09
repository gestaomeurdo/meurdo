import { useFieldArray, useFormContext } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2 } from "lucide-react";
import { RdoInput } from "@/hooks/use-rdo";

const RdoEquipmentForm = () => {
  const { control } = useFormContext<RdoInput>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "equipamentos",
  });

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold border-b pb-2">Equipamentos/Ferramentas</h3>
      {fields.map((field, index) => (
        <div key={field.id} className="p-4 border rounded-lg space-y-3 bg-secondary/10">
          <div className="flex justify-between items-start">
            <Label className="font-medium">Equipamento #{index + 1}</Label>
            <Button variant="ghost" size="icon" onClick={() => remove(index)} title="Remover Equipamento">
              <Trash2 className="w-4 h-4 text-destructive" />
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label htmlFor={`equipamento-${index}`}>Equipamento</Label>
              <Input
                id={`equipamento-${index}`}
                placeholder="Ex: Betoneira, Escavadeira"
                {...control.register(`equipamentos.${index}.equipamento`)}
              />
            </div>
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