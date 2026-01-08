import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { showSuccess, showError } from "@/utils/toast";
import { Loader2, Save } from "lucide-react";
import { useCreateExpenseCategory, useUpdateExpenseCategory, ExpenseCategory } from "@/hooks/use-expense-categories";

const CategorySchema = z.object({
  nome: z.string().min(3, "O nome deve ter pelo menos 3 caracteres."),
  descricao: z.string().nullable().optional(),
});

type CategoryFormValues = z.infer<typeof CategorySchema>;

interface CategoryFormProps {
  initialData?: ExpenseCategory;
  onSuccess: () => void;
}

const CategoryForm = ({ initialData, onSuccess }: CategoryFormProps) => {
  const isEditing = !!initialData;
  const createMutation = useCreateExpenseCategory();
  const updateMutation = useUpdateExpenseCategory();

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(CategorySchema),
    defaultValues: {
      nome: initialData?.nome || "",
      descricao: initialData?.descricao || "",
    },
  });

  const onSubmit = async (values: CategoryFormValues) => {
    try {
      const payload = {
        nome: values.nome.trim(),
        descricao: values.descricao?.trim() || null,
      };

      if (isEditing && initialData) {
        await updateMutation.mutateAsync({ ...payload, id: initialData.id });
        showSuccess("Categoria atualizada com sucesso!");
      } else {
        await createMutation.mutateAsync(payload);
        showSuccess("Categoria criada com sucesso!");
      }
      onSuccess();
    } catch (error) {
      showError(`Erro ao salvar categoria: ${error instanceof Error ? error.message : "Erro desconhecido"}`);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="nome"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome da Categoria</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Material de Construção" {...field} disabled={isLoading} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="descricao"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição (Opcional)</FormLabel>
              <FormControl>
                <Textarea placeholder="Detalhes sobre o tipo de despesa" {...field} value={field.value || ""} disabled={isLoading} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          {isEditing ? "Salvar Alterações" : "Criar Categoria"}
        </Button>
      </form>
    </Form>
  );
};

export default CategoryForm;