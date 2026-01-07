import { useCallback } from "react";
import { UseFormSetValue, UseFormGetValues } from "react-hook-form";
import { parseCurrencyInput, formatCurrencyForInput } from "@/utils/formatters";

/**
 * Hook para gerenciar a formatação de moeda em tempo real em campos de input.
 * Garante que o valor exibido seja formatado (ex: 1.000,00) enquanto o valor
 * real (numérico) no formulário seja o valor limpo (ex: 1000.00).
 * 
 * @param name O nome do campo no formulário (ex: 'orcamento_inicial').
 * @param setValue A função setValue do useForm.
 * @param getValues A função getValues do useForm.
 */
export const useCurrencyInput = (
  name: string,
  setValue: UseFormSetValue<any>,
  getValues: UseFormGetValues<any>
) => {

  const handleCurrencyChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = event.target.value;
    
    // 1. Limpa o valor para obter o número real
    const numericValue = parseCurrencyInput(rawValue);
    
    // 2. Formata o valor numérico de volta para a string de exibição (ex: 1000.00 -> 1.000,00)
    const formattedValue = formatCurrencyForInput(numericValue);

    // 3. Atualiza o valor do campo no formulário com a string formatada
    setValue(name, formattedValue, { shouldValidate: true });
  }, [name, setValue]);

  // Função para obter o valor formatado atual para o input
  const getFormattedValue = () => {
    const value = getValues(name);
    return value || '';
  };

  return {
    handleCurrencyChange,
    getFormattedValue,
  };
};