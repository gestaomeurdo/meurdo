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
 * Suporta formatos BR (1.234,56) e formatos US/Técnicos (1234.56).
 */
export const parseCurrencyInput = (value: string): number => {
  if (!value) return 0;
  
  const cleanValue = value.toString().trim();

  // Se a string contém vírgula, assume-se formato BR (ex: 1.000,00)
  if (cleanValue.includes(',')) {
    const cleaned = cleanValue.replace(/\./g, '').replace(',', '.').replace(/[^0-9.-]/g, '');
    return parseFloat(cleaned) || 0;
  }
  
  // Se contiver ponto e NÃO contiver vírgula, tratamos como formato decimal US/Técnico (ex: 1250.50)
  if (cleanValue.includes('.') && !cleanValue.includes(',')) {
     const cleaned = cleanValue.replace(/[^0-9.-]/g, '');
     return parseFloat(cleaned) || 0;
  }

  // Se for apenas dígitos, trata como número inteiro
  const onlyDigits = cleanValue.replace(/[^0-9-]/g, '');
  return parseFloat(onlyDigits) || 0;
};

/**
 * Formata um número para exibição em input de texto (BRL format: 1.000,00).
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
 */
export const formatDate = (date: string | Date, dateFormat: string = 'dd/MM/yyyy'): string => {
  if (!date) return 'N/A';
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, dateFormat, { locale: ptBR });
};