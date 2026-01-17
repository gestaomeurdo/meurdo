import { useFieldArray, useFormContext } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Package } from "lucide-react";
import { RdoInput } from "@/hooks/use-rdo";
import { Textarea } from "@/components/ui/textarea";

const RdoMaterialsForm = () => {
  const { control } = useFormContext<RdoInput>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "materiais",
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center border-b pb-2">
        <h3 className="text-lg font-semibold">Controle de Materiais do Dia</h3>
        <div className="text-sm font-medium text-muted-foreground flex items-center">
            <Package className="w-4 h-4 mr-2" />
            Registro de Consumo
        </div>
      </div>

      {fields.map((field, index) => (
        <div key={field.id} className="p-4 border rounded-xl space-y-4 bg-secondary/5 relative group transition-all hover:border-primary/50">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => remove(index)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-5">
              <Label className="text-xs uppercase text-muted-foreground">Nome do Material</Label>
              <Input
                placeholder="Ex: Cimento CP V"
                {...control.register(`materiais.${index}.nome_material`)}
                className="bg-background"
              />
            </div>
            <div className="md:col-span-3">
              <Label className="text-xs uppercase text-muted-foreground">Unidade</Label>
              <Input
                placeholder="Ex: Saco, m3, un"
                {...control.register(`materiais.${index}.unidade`)}
                className="bg-background"
              />
            </div>
            <div className="md:col-span-4">
              <Label className="text-xs uppercase text-muted-foreground">Qtd. Consumida</Label>
              <Input
                type="number"
                step="0.01"
                {...control.register(`materiais.${index}.quantidade_consumida`, { valueAsNumber: true })}
                min={0}
                className="bg-background"
              />
            </div>
          </div>
          
          <div>
            <Label className="text-xs uppercase text-muted-foreground">Observação (Opcional)</Label>
            <Textarea
              placeholder="Onde foi usado? (Ex: Concretagem da laje)"
              {...control.register(`materiais.${index}.observacao`)}
              rows={1}
              className="bg-background"
            />
          </div>
        </div>
      ))}

      <Button type="button" variant="outline" className="w-full border-dashed py-6 hover:bg-primary/5 hover:text-primary transition-all" onClick={() => append({ nome_material: "", unidade: "", quantidade_entrada: 0, quantidade_consumida: 0, observacao: null })}>
        <Plus className="w-4 h-4 mr-2" /> Adicionar Material Consumido
      </Button>
    </div>
  );
};

export default RdoMaterialsForm;