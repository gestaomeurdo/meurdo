import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

/**
 * Formata um valor numérico para a moeda brasileira (BRL).
 */
export const formatCurrency = (value: number | null | undefined, options?: Intl.NumberFormatOptions): string => {
  if (value === null || value === undefined) return "R$ 0,00";
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    ...options
  }).format(value);
};

/**
 * Converte uma string formatada para um número decimal.
 */
export const parseCurrencyInput = (value: string): number => {
  if (!value) return 0;
  const cleanValue = value.toString().trim();

  if (cleanValue.includes(',')) {
    const cleaned = cleanValue.replace(/\./g, '').replace(',', '.').replace(/[^0-9.-]/g, '');
    return parseFloat(cleaned) || 0;
  }

  if (cleanValue.includes('.') && !cleanValue.includes(',')) {
    const cleaned = cleanValue.replace(/[^0-9-]/g, '');
    return parseFloat(cleaned) || 0;
  }

  const onlyDigits = cleanValue.replace(/[^0-9-]/g, '');
  return parseFloat(onlyDigits) || 0;
};

/**
 * Formata um número para exibição em input de texto.
 */
export const formatCurrencyForInput = (value: number | undefined): string => {
  if (value === undefined || value === null) return "0,00";
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

/**
 * Formata uma data para o formato DD/MM/YYYY.
 */
export const formatDate = (date: string | Date, dateFormat: string = 'dd/MM/yyyy'): string => {
  if (!date) return 'Não inf.';
  try {
    const dateObj = typeof date === 'string' ? new Date(date + 'T12:00:00') : date;
    return format(dateObj, dateFormat, { locale: ptBR });
  } catch (e) {
    return 'Data inv.';
  }
};