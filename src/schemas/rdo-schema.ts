import { z } from "zod";

export const RdoSchema = z.object({
  obra_id: z.string().uuid(),
  data_rdo: z.date(),
  
  // Novos campos de clima por período
  morning_enabled: z.boolean().default(true),
  morning_clima: z.string().default("Sol"),
  morning_status: z.string().default("Operacional"),
  
  afternoon_enabled: z.boolean().default(true),
  afternoon_clima: z.string().default("Sol"),
  afternoon_status: z.string().default("Operacional"),
  
  night_enabled: z.boolean().default(false),
  night_clima: z.string().default("Sol"),
  night_status: z.string().default("Operacional"),

  status_dia: z.string().min(1, "Obrigatório"),
  observacoes_gerais: z.string().optional(),
  impedimentos_comentarios: z.string().optional(),
  responsible_signature_url: z.string().nullable().optional(),
  client_signature_url: z.string().nullable().optional(),
  signer_name: z.string().optional(),
  
  safety_nr35: z.boolean().default(false),
  safety_epi: z.boolean().default(false),
  safety_cleaning: z.boolean().default(false),
  safety_dds: z.boolean().default(false),
  safety_comments: z.string().optional(),

  atividades: z.array(z.object({
    descricao_servico: z.string(),
    avanco_percentual: z.number().min(0).max(100),
    foto_anexo_url: z.string().nullable().optional(),
    observacao: z.string().nullable().optional(),
  })).default([]),

  mao_de_obra: z.array(z.object({
    funcao: z.string(),
    quantidade: z.number().min(1),
    custo_unitario: z.number().optional(),
    tipo: z.string().optional(),
    observacao: z.string().nullable().optional(),
  })).default([]),

  equipamentos: z.array(z.object({
    equipamento: z.string(),
    horas_trabalhadas: z.number().min(0),
    horas_paradas: z.number().min(0),
    custo_hora: z.number().optional(),
    observacao: z.string().nullable().optional(),
  })).default([]),

  materiais: z.array(z.object({
    nome_material: z.string(),
    unidade: z.string(),
    quantidade_entrada: z.number().default(0),
    quantidade_consumida: z.number().default(0),
    observacao: z.string().nullable().optional(),
  })).default([]),
});

export type RdoFormValues = z.infer<typeof RdoSchema>;