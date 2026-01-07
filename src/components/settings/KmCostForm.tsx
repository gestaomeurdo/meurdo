import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2, Save } from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";
import { useKmCost, useUpdateKmCost } from "@/hooks/use-km-cost";
import { parseCurrencyInput, formatCurrencyForInput } from "@/utils/formatters";
import { useCurrencyInput } from "@/hooks/use-currency-input";

const KmCostSchema = z.object({
  valor: z.string().min(1, "O valor é obrigatório."),
}).refine((data) => {
    const parsedValue = parseCurrencyInput(data.valor);
    return parsedValue >= 0;
}, {
    message: "O custo deve ser um valor numérico positivo.",
    path: ["valor"],
});

type KmCostFormValues = z.infer<typeof KmCostSchema>;

const KmCostForm = () => {
  const { data: currentCost, isLoading: isLoadingCost } = useKmCost();
  const updateMutation = useUpdateKmCost();

  const form = useForm<KmCostFormValues>({
    resolver: zodResolver(KmCostSchema),
    values: {
      valor: formatCurrencyForInput(currentCost),
    },
    mode: 'onChange',
  });

  const { handleCurrencyChange } = useCurrencyInput('valor', form.setValue, form.getValues);

  const onSubmit = async (values: KmCostFormValues) => {
    const parsedValor = parseCurrencyInput(values.valor);

    try {
      await updateMutation.mutateAsync(parsedValor);
      showSuccess("Custo por KM atualizado com sucesso!");
    } catch (error) {
      showError(`Erro ao atualizar custo: ${error instanceof Error ? error.message : "Erro desconhecido"}`);
    }
  };

  const isLoading = isLoadingCost || updateMutation.isPending;

  if (isLoadingCost) {
    return <Loader2 className="h-6 w-6 animate-spin text-primary" />;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-w-md">
        <FormField
          control={form.control}
          name="valor"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Custo por KM Rodado (R$)</FormLabel>
              <FormControl>
                <Input 
                  type="text" 
                  placeholder="1,50" 
                  {...field} 
                  onChange={(e) => {
                    field.onChange(e);
                    handleCurrencyChange(e);
                  }}
                  disabled={isLoading} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isLoading}>
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Salvar Custo
        </Button>
      </form>
    </Form>
  );
};

export default KmCostForm;