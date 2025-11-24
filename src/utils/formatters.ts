import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

/**
 * Formata um valor numérico para a moeda brasileira (BRL).
 * @param value O valor a ser formatado.
 * @param options Opções de formatação (ex: maximumFractionDigits).
 * @returns String formatada como moeda.
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
 * Formata um valor de moeda em string (BRL format: 1.000,00) para um número.
 * @param value A string de moeda.
 * @returns O valor numérico.
 */
export const parseCurrencyInput = (value: string): number => {
  if (!value) return 0;
  // Remove thousands separators (dots) and replace decimal comma with dot
  const cleanedValue = value.replace(/\./g, '').replace(',', '.');
  return parseFloat(cleanedValue) || 0;
};

/**
 * Formata um número para exibição em input de texto (BRL format: 1.000,00).
 * @param value O valor numérico.
 * @returns String formatada.
 */
export const formatCurrencyForInput = (value: number | undefined): string => {
  if (value === undefined || value === null) return "";
  return new Intl.NumberFormat('pt-BR', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  }).format(value);
};

/**
 * Formata uma data para o formato DD/MM/YYYY.
 * @param dateString A string de data (YYYY-MM-DD) ou objeto Date.
 * @returns String formatada.
 */
export const formatDate = (date: string | Date, dateFormat: string = 'dd/MM/yyyy'): string => {
  if (!date) return 'N/A';
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, dateFormat, { locale: ptBR });
};