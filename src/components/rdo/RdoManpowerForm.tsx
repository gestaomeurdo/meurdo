import { useFieldArray, useFormContext } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Calculator, Users, Search } from "lucide-react";
import { useCargos } from "@/hooks/use-cargos";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency } from "@/utils/formatters";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";

const RdoManpowerForm = () => {
  const { control, setValue, watch, register } = useFormContext<any>();
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
          Automático
        </div>
      </div>

      {cargos && cargos.length === 0 && (
        <div className="text-center p-4 bg-yellow-50 border border-yellow-200 rounded-xl mb-4">
            <p className="text-xs text-yellow-800 mb-2">Nenhuma função cadastrada no banco.</p>
            <Button variant="outline" size="sm" className="h-8 text-xs" asChild>
                <Link to="/mao-de-obra">Cadastrar Funções</Link>
            </Button>
        </div>
      )}

      {fields.map((field, index) => {
        // Watch specific fields for calculations to ensure reactivity
        const qty = maoDeObra?.[index]?.quantidade || 0;
        const price = maoDeObra?.[index]?.custo_unitario || 0;
        const subtotal = qty * price;
        const type = maoDeObra?.[index]?.tipo;

        return (
          <div
            key={field.id}
            className="p-4 border rounded-2xl space-y-4 bg-secondary/5 relative group transition-all hover:border-primary/40 hover:shadow-sm"
          >
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 text-destructive hover:bg-destructive/10"
              onClick={() => remove(index)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
              {/* Seletor de Cargo (Helper) */}
              <div className="md:col-span-4 space-y-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground flex items-center gap-1">
                  <Search className="w-3 h-3" /> Preencher com Banco
                </Label>
                <Select onValueChange={(val) => handleCargoSelect(index, val)}>
                  <SelectTrigger className="bg-background rounded-xl border-muted-foreground/20 h-9 text-xs">
                    <SelectValue placeholder="Selecione para preencher..." />
                  </SelectTrigger>
                  <SelectContent>
                    {cargos?.map(c => (
                      <SelectItem key={c.id} value={c.id} className="text-xs">
                        {c.nome} ({formatCurrency(c.custo_diario)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Input Nome Função */}
              <div className="md:col-span-3 space-y-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground">
                  Função / Cargo
                </Label>
                <Input
                  {...register(`mao_de_obra.${index}.funcao`)}
                  placeholder="Ex: Pedreiro"
                  className="bg-background rounded-xl border-muted-foreground/20 h-9"
                />
              </div>

              {/* Input Quantidade */}
              <div className="md:col-span-1 space-y-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground">
                  Qtd
                </Label>
                <Input
                  type="number"
                  {...register(`mao_de_obra.${index}.quantidade`, { valueAsNumber: true })}
                  className="bg-background rounded-xl border-muted-foreground/20 font-bold h-9 text-center"
                  min={0}
                  step={1}
                />
              </div>

              {/* Input Custo */}
              <div className="md:col-span-2 space-y-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground">
                  Custo (R$)
                </Label>
                <Input
                  type="number"
                  {...register(`mao_de_obra.${index}.custo_unitario`, { valueAsNumber: true })}
                  className="bg-background rounded-xl border-muted-foreground/20 h-9"
                  min={0}
                  step={0.01}
                />
              </div>

              {/* Subtotal Display */}
              <div className="md:col-span-2 space-y-2">
                <Label className="text-[10px] font-black uppercase text-primary">
                  Subtotal
                </Label>
                <div className="h-9 flex items-center justify-center px-2 bg-primary/10 border border-primary/20 rounded-xl font-black text-primary text-xs">
                  {formatCurrency(subtotal)}
                </div>
              </div>
            </div>

            {/* Tipo Badge */}
            <div className="flex items-center gap-2 pt-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase">
                Vínculo:
              </span>
              <Badge
                variant={type === 'Própria' ? 'default' : 'outline'}
                className="text-[10px] uppercase font-black tracking-widest px-2 py-0 h-5"
              >
                {type || 'Indefinido'}
              </Badge>
            </div>
          </div>
        );
      })}

      <Button
        type="button"
        variant="outline"
        className="w-full border-dashed border-primary/40 py-6 rounded-2xl hover:bg-primary/5 hover:text-primary transition-all font-bold uppercase text-xs tracking-widest"
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