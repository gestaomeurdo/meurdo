import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Cargo, useCreateCargo, useUpdateCargo } from "@/hooks/use-cargos";
import { showSuccess, showError } from "@/utils/toast";
import { Loader2, Save } from "lucide-react";

const CargoSchema = z.object({
  nome: z.string().min(3, "O nome deve ter pelo menos 3 caracteres."),
  custo_diario: z.coerce.number().min(0, "O custo não pode ser negativo."),
  tipo: z.enum(['Próprio', 'Empreiteiro']),
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

  const form = useForm<CargoFormValues>({
    resolver: zodResolver(CargoSchema),
    defaultValues: {
      nome: initialData?.nome || "",
      custo_diario: initialData?.custo_diario || 0,
      tipo: initialData?.tipo || 'Próprio',
    },
  });

  const onSubmit = async (values: CargoFormValues) => {
    try {
      if (isEditing && initialData) {
        await updateMutation.mutateAsync({ ...values, id: initialData.id });
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

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField control={form.control} name="nome" render={({ field }) => (
            <FormItem><FormLabel>Nome do Cargo</FormLabel><FormControl><Input placeholder="Ex: Pedreiro" {...field} disabled={isLoading} /></FormControl><FormMessage /></FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="custo_diario" render={({ field }) => (
              <FormItem><FormLabel>Custo Diário (R$)</FormLabel><FormControl><Input type="number" step="0.01" {...field} disabled={isLoading} /></FormControl><FormMessage /></FormItem>
            )}
          />
          <FormField control={form.control} name="tipo" render={({ field }) => (
              <FormItem><FormLabel>Tipo</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}><FormControl><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger></FormControl><SelectContent><SelectItem value="Próprio">Próprio</SelectItem><SelectItem value="Empreiteiro">Empreiteiro</SelectItem></SelectContent></Select><FormMessage /></FormItem>
            )}
          />
        </div>
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          {isEditing ? "Salvar Alterações" : "Cadastrar Cargo"}
        </Button>
      </form>
    </Form>
  );
};

export default CargoForm;