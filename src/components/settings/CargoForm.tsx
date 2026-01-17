import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Cargo, useCreateCargo, useUpdateCargo } from "@/hooks/use-cargos";
import { showSuccess, showError } from "@/utils/toast";
import { Loader2, Save, Zap } from "lucide-react";
import { useCargoLimits } from "@/hooks/use-cargo-limits";

const CargoSchema = z.object({
  nome: z.string().min(3, "O nome deve ter pelo menos 3 caracteres."),
  custo_diario: z.coerce.number().min(0, "O custo não pode ser negativo."),
  tipo: z.enum(['Próprio', 'Empreiteiro']),
  unidade: z.enum(['Diário', 'Hora']),
});

type CargoFormValues = z.infer<typeof CargoSchema>;

interface CargoFormProps {
  initialData?: Cargo;
  onSuccess: () => void;
}

const CargoForm = ({ initialData, onSuccess }: CargoFormProps) => {
  const isEditing = !!initialData;
  const createMutation = useCreateCargo();
  const updateMutation = useUpdateCargo();
  const { canCreateCargo, isPro, cargoCount, limit } = useCargoLimits();

  const form = useForm<CargoFormValues>({
    resolver: zodResolver(CargoSchema),
    defaultValues: {
      nome: initialData?.nome || "",
      custo_diario: initialData?.custo_diario || 0,
      tipo: initialData?.tipo || 'Próprio',
      unidade: initialData?.unidade || 'Diário',
    },
  });

  const onSubmit = async (values: CargoFormValues) => {
    if (!isEditing && !canCreateCargo) {
      showError(`Limite de ${limit} cargos atingido no plano gratuito.`);
      return;
    }

    try {
      if (isEditing && initialData) {
        await updateMutation.mutateAsync({
          ...values,
          id: initialData.id
        });
        showSuccess("Cargo atualizado!");
      } else {
        await createMutation.mutateAsync(values);
        showSuccess("Cargo cadastrado!");
      }
      onSuccess();
    } catch (error) {
      showError(`Erro ao salvar: ${error instanceof Error ? error.message : "Erro desconhecido"}`);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;
  const isCreationDisabledByLimit = !isEditing && !canCreateCargo;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="nome"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome da Função</FormLabel>
              <FormControl>
                <Input
                  placeholder="Ex: Pedreiro Especialista"
                  {...field}
                  disabled={isLoading || isCreationDisabledByLimit}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="tipo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de Contratação</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={isLoading || isCreationDisabledByLimit}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Próprio">Próprio (CLT/Direto)</SelectItem>
                    <SelectItem value="Empreiteiro">Empreiteiro (Terceiro)</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="unidade"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Unidade de Cálculo</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={isLoading || isCreationDisabledByLimit}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Diário">Custo por Dia</SelectItem>
                    <SelectItem value="Hora">Custo por Hora</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="custo_diario"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Valor do Custo Unitário (R$)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  {...field}
                  disabled={isLoading || isCreationDisabledByLimit}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          type="submit"
          className="w-full bg-[#066abc] hover:bg-[#066abc]/90"
          disabled={isLoading || isCreationDisabledByLimit}
        >
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          {isEditing ? "Salvar Alterações" : "Cadastrar Função"}
        </Button>
        {isCreationDisabledByLimit && (
          <div className="text-center pt-2">
            <p className="text-xs text-destructive flex items-center justify-center gap-1">
              <Zap className="w-3 h-3" />
              Limite de {limit} cargos atingido.
            </p>
          </div>
        )}
      </form>
    </Form>
  );
};

export default CargoForm;