import { useCallback } from "react";
import { UseFormSetValue, UseFormGetValues } from "react-hook-form";
import { formatCurrencyForInput } from "@/utils/formatters";

/**
 * Hook para gerenciar a formatação de moeda em tempo real.
 * Utiliza a lógica de "máscara de banco" (digita os números e eles deslocam para a esquerda).
 */
export const useCurrencyInput = (
  name: string,
  setValue: UseFormSetValue<any>,
  getValues: UseFormGetValues<any>
) => {
  const handleCurrencyChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    let rawValue = event.target.value;

    // Remove tudo que não for dígito
    const digitsOnly = rawValue.replace(/\D/g, '');

    if (!digitsOnly) {
      setValue(name, "0,00", { shouldValidate: true });
      return;
    }

    // Converte para número (ex: 1000 -> 10.00)
    const numericValue = parseInt(digitsOnly, 10) / 100;

    // Formata para a string de exibição (ex: 10.00 -> 10,00)
    const formattedValue = formatCurrencyForInput(numericValue);

    // Atualiza o valor do campo no formulário
    setValue(name, formattedValue, { shouldValidate: true });
  }, [name, setValue]);

  const getFormattedValue = () => {
    const value = getValues(name);
    return value || '0,00';
  };

  return {
    handleCurrencyChange,
    getFormattedValue,
  };
};