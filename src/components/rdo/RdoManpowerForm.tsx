import { useFieldArray, useFormContext } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2 } from "lucide-react";
import { RdoInput } from "@/hooks/use-rdo";

const RdoManpowerForm = () => {
  const { control } = useFormContext<RdoInput>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "mao_de_obra",
  });

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold border-b pb-2">Mão de Obra (Efetivo)</h3>
      {fields.map((field, index) => (
        <div key={field.id} className="p-4 border rounded-lg space-y-3 bg-secondary/10">
          <div className="flex justify-between items-start">
            <Label className="font-medium">Função #{index + 1}</Label>
            <Button variant="ghost" size="icon" onClick={() => remove(index)} title="Remover Função">
              <Trash2 className="w-4 h-4 text-destructive" />
            </Button>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor={`funcao-${index}`}>Função</Label>
              <Input
                id={`funcao-${index}`}
                placeholder="Ex: Pedreiro, Servente, Carpinteiro"
                {...control.register(`mao_de_obra.${index}.funcao`)}
              />
            </div>
            <div>
              <Label htmlFor={`quantidade-${index}`}>Quantidade</Label>
              <Input
                id={`quantidade-${index}`}
                type="number"
                placeholder="0"
                {...control.register(`mao_de_obra.${index}.quantidade`, { valueAsNumber: true })}
                min={0}
              />
            </div>
          </div>
        </div>
      ))}
      <Button type="button" variant="outline" onClick={() => append({ funcao: "", quantidade: 1 })}>
        <Plus className="w-4 h-4 mr-2" /> Adicionar Função
      </Button>
    </div>
  );
};

export default RdoManpowerForm;