import { useFieldArray, useFormContext } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Calculator, Users } from "lucide-react";
import { RdoInput, WorkforceType } from "@/hooks/use-rdo";
import { useCargos } from "@/hooks/use-cargos";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency } from "@/utils/formatters";
import { Badge } from "@/components/ui/badge";

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
      // Preenchimento Automático Inteligente
      setValue(`mao_de_obra.${index}.funcao`, cargo.nome);
      setValue(`mao_de_obra.${index}.custo_unitario`, cargo.custo_diario);
      setValue(`mao_de_obra.${index}.tipo`, cargo.tipo === 'Próprio' ? 'Própria' : 'Terceirizada');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center border-b pb-3">
        <h3 className="text-lg font-bold uppercase tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Efetivo em Campo
        </h3>
        <div className="text-[10px] font-black text-muted-foreground uppercase flex items-center bg-accent px-2 py-1 rounded-full">
            <Calculator className="w-3 h-3 mr-1 text-primary" />
            Cálculo automático ativado
        </div>
      </div>

      {fields.map((field, index) => {
        const qty = maoDeObra?.[index]?.quantidade || 0;
        const price = maoDeObra?.[index]?.custo_unitario || 0;
        const subtotal = qty * price;
        const type = maoDeObra?.[index]?.tipo;

        return (
          <div key={field.id} className="p-4 border rounded-2xl space-y-4 bg-secondary/5 relative group transition-all hover:border-primary/40 hover:shadow-sm">
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
              <div className="md:col-span-4 space-y-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground">Selecionar da Tabela de Cargos</Label>
                <Select onValueChange={(val) => handleCargoSelect(index, val)}>
                  <SelectTrigger className="bg-background rounded-xl border-muted-foreground/20">
                    <SelectValue placeholder="Busque uma função cadastrada..." />
                  </SelectTrigger>
                  <SelectContent>
                    {cargos?.map(c => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.nome} ({c.unidade === 'Hora' ? 'R$/h' : 'R$/dia'})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="md:col-span-3 space-y-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground">Nome (Personalizado)</Label>
                <Input
                  placeholder="Ex: Pedreiro"
                  {...control.register(`mao_de_obra.${index}.funcao`)}
                  className="bg-background rounded-xl border-muted-foreground/20"
                />
              </div>
              
              <div className="md:col-span-1 space-y-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground">Qtd</Label>
                <Input
                  type="number"
                  {...control.register(`mao_de_obra.${index}.quantidade`, { valueAsNumber: true })}
                  min={0}
                  className="bg-background rounded-xl border-muted-foreground/20 font-bold"
                />
              </div>

              <div className="md:col-span-2 space-y-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground">Custo Unit. (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  {...control.register(`mao_de_obra.${index}.custo_unitario`, { valueAsNumber: true })}
                  min={0}
                  className="bg-background rounded-xl border-muted-foreground/20"
                />
              </div>

              <div className="md:col-span-2 space-y-2">
                <Label className="text-[10px] font-black uppercase text-primary">Subtotal</Label>
                <div className="h-10 flex items-center px-3 bg-primary/10 border border-primary/20 rounded-xl font-black text-primary text-sm">
                  {formatCurrency(subtotal)}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-muted-foreground uppercase">Tipo:</span>
                <Badge variant="outline" className="text-[10px] uppercase font-black tracking-widest px-2 py-0">
                    {type || 'Não definido'}
                </Badge>
            </div>
          </div>
        );
      })}

      <Button 
        type="button" 
        variant="outline" 
        className="w-full border-dashed border-primary/40 py-8 rounded-2xl hover:bg-primary/5 hover:text-primary transition-all font-bold uppercase text-xs tracking-widest" 
        onClick={() => append({ funcao: "", quantidade: 1, custo_unitario: 0, tipo: 'Própria' })}
      >
        <Plus className="w-4 h-4 mr-2" /> Adicionar Outra Função ao Dia
      </Button>
    </div>
  );
};

export default RdoManpowerForm;