import { useFieldArray, useFormContext } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Search } from "lucide-react";
import { RdoInput } from "@/hooks/use-rdo";
import { useCargos } from "@/hooks/use-cargos";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const RdoManpowerForm = () => {
  const { control, setValue } = useFormContext<any>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "mao_de_obra",
  });
  
  const { data: cargos } = useCargos();

  const handleCargoSelect = (index: number, cargoId: string) => {
    const cargo = cargos?.find(c => c.id === cargoId);
    if (cargo) {
      setValue(`mao_de_obra.${index}.funcao`, cargo.nome);
      setValue(`mao_de_obra.${index}.custo_unitario`, cargo.custo_diario);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold border-b pb-2 flex-grow">Mão de Obra (Efetivo)</h3>
      </div>
      {fields.map((field, index) => (
        <div key={field.id} className="p-4 border rounded-lg space-y-4 bg-secondary/5 relative">
          <Button 
            type="button"
            variant="ghost" 
            size="icon" 
            className="absolute top-2 right-2 text-destructive hover:bg-destructive/10" 
            onClick={() => remove(index)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-1">
              <Label>Cargo Cadastrado</Label>
              <Select onValueChange={(val) => handleCargoSelect(index, val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar..." />
                </SelectTrigger>
                <SelectContent>
                  {cargos?.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="md:col-span-1">
              <Label>Nome da Função</Label>
              <Input
                placeholder="Ex: Pedreiro"
                {...control.register(`mao_de_obra.${index}.funcao`)}
              />
            </div>

            <div>
              <Label>Quantidade</Label>
              <Input
                type="number"
                {...control.register(`mao_de_obra.${index}.quantidade`, { valueAsNumber: true })}
                min={0}
              />
            </div>

            <div>
              <Label>Custo Diário (R$)</Label>
              <Input
                type="number"
                step="0.01"
                {...control.register(`mao_de_obra.${index}.custo_unitario`, { valueAsNumber: true })}
                min={0}
              />
            </div>
          </div>
        </div>
      ))}
      <Button type="button" variant="outline" className="w-full border-dashed" onClick={() => append({ funcao: "", quantidade: 1, custo_unitario: 0 })}>
        <Plus className="w-4 h-4 mr-2" /> Adicionar Função Manualmente
      </Button>
    </div>
  );
};

export default RdoManpowerForm;