import { useFieldArray, useFormContext } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Calculator } from "lucide-react";
import { RdoInput, WorkforceType } from "@/hooks/use-rdo";
import { useCargos } from "@/hooks/use-cargos";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency } from "@/utils/formatters";
import { useEffect } from "react";

const workforceTypes: WorkforceType[] = ['Própria', 'Terceirizada'];

const RdoManpowerForm = () => {
  const { control, setValue, watch } = useFormContext<any>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "mao_de_obra",
  });

  const { data: cargos } = useCargos();
  const maoDeObra = watch("mao_de_obra");

  const handleCargoSelect = (index: number, cargoId: string) => {
    const cargo = cargos?.find(c => c.id === cargoId);
    if (cargo) {
      setValue(`mao_de_obra.${index}.funcao`, cargo.nome);
      setValue(`mao_de_obra.${index}.custo_unitario`, cargo.custo_diario);
      setValue(`mao_de_obra.${index}.tipo`, cargo.tipo); // Set type from cargo
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center border-b pb-2">
        <h3 className="text-lg font-semibold">Efetivo de Mão de Obra</h3>
        <div className="text-sm font-medium text-muted-foreground flex items-center">
            <Calculator className="w-4 h-4 mr-2" />
            Clique no cargo para puxar o custo automático
        </div>
      </div>

      {fields.map((field, index) => {
        const qty = maoDeObra?.[index]?.quantidade || 0;
        const price = maoDeObra?.[index]?.custo_unitario || 0;
        const subtotal = qty * price;

        return (
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

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
              <div className="md:col-span-4">
                <Label className="text-xs uppercase text-muted-foreground">Buscar Cargo de Referência</Label>
                <Select onValueChange={(val) => handleCargoSelect(index, val)}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Selecione o cargo..." />
                  </SelectTrigger>
                  <SelectContent>
                    {cargos?.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.nome} ({c.tipo})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="md:col-span-3">
                <Label className="text-xs uppercase text-muted-foreground">Nome Exibido</Label>
                <Input
                  placeholder="Nome do cargo"
                  {...control.register(`mao_de_obra.${index}.funcao`)}
                  className="bg-background"
                />
              </div>
              
              <div className="md:col-span-2">
                <Label className="text-xs uppercase text-muted-foreground">Tipo</Label>
                <Select onValueChange={(val) => setValue(`mao_de_obra.${index}.tipo`, val as WorkforceType)} defaultValue={maoDeObra?.[index]?.tipo}>
                    <SelectTrigger className="bg-background">
                        <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                    <SelectContent>
                        {workforceTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                    </SelectContent>
                </Select>
              </div>

              <div className="md:col-span-1">
                <Label className="text-xs uppercase text-muted-foreground">Qtd</Label>
                <Input
                  type="number"
                  {...control.register(`mao_de_obra.${index}.quantidade`, { valueAsNumber: true })}
                  min={0}
                  className="bg-background"
                />
              </div>

              <div className="md:col-span-2">
                <Label className="text-xs uppercase text-muted-foreground">Custo Unit. (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  {...control.register(`mao_de_obra.${index}.custo_unitario`, { valueAsNumber: true })}
                  min={0}
                  className="bg-background"
                />
              </div>

              <div className="md:col-span-2">
                <Label className="text-xs uppercase text-primary font-bold">Subtotal</Label>
                <div className="h-10 flex items-center px-3 bg-primary/10 border border-primary/20 rounded-md font-bold text-primary">
                  {formatCurrency(subtotal)}
                </div>
              </div>
            </div>
          </div>
        );
      })}

      <Button type="button" variant="outline" className="w-full border-dashed py-6 hover:bg-primary/5 hover:text-primary transition-all" onClick={() => append({ funcao: "", quantidade: 1, custo_unitario: 0, tipo: 'Própria' })}>
        <Plus className="w-4 h-4 mr-2" /> Adicionar Outra Função
      </Button>
    </div>
  );
};

export default RdoManpowerForm;