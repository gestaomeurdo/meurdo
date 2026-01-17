import { Cargo } from "@/hooks/use-cargos";

// Suggested daily costs are placeholders and can be adjusted by the user.
export const DEFAULT_CARGOS: Omit<Cargo, 'id' | 'user_id'>[] = [
  {
    nome: 'Mestre de Obras',
    custo_diario: 250.00,
    tipo: 'Próprio',
    unidade: 'Diário',
  },
  {
    nome: 'Encarregado',
    custo_diario: 200.00,
    tipo: 'Próprio',
    unidade: 'Diário',
  },
  {
    nome: 'Pedreiro',
    custo_diario: 150.00,
    tipo: 'Próprio',
    unidade: 'Diário',
  },
  {
    nome: 'Servente',
    custo_diario: 100.00,
    tipo: 'Próprio',
    unidade: 'Diário',
  },
  {
    nome: 'Carpinteiro',
    custo_diario: 180.00,
    tipo: 'Próprio',
    unidade: 'Diário',
  },
  {
    nome: 'Armador',
    custo_diario: 170.00,
    tipo: 'Próprio',
    unidade: 'Diário',
  },
  {
    nome: 'Eletricista (Terceirizado)',
    custo_diario: 300.00,
    tipo: 'Empreiteiro',
    unidade: 'Diário',
  },
];