export interface AtividadeModelItem {
  descricao: string;
  etapa: string;
}

export interface AtividadeModel {
  id: string;
  nome: string;
  descricao: string;
  isPremium: boolean;
  atividades: AtividadeModelItem[];
}

export const ATIVIDADE_MODELS: AtividadeModel[] = [
  {
    id: 'residencial-padrao',
    nome: 'Modelo Residencial',
    descricao: 'Cronograma para casas e sobrados: Fundação, Alvenaria e Acabamentos.',
    isPremium: false,
    atividades: [
      { descricao: 'Instalação de Canteiro e Barracão', etapa: 'Serviços Preliminares' },
      { descricao: 'Locação da Obra (Gabarito)', etapa: 'Serviços Preliminares' },
      { descricao: 'Escavação de Fundações', etapa: 'Infraestrutura' },
      { descricao: 'Armação de Ferragens', etapa: 'Infraestrutura' },
      { descricao: 'Concretagem de Sapatas/Blocos', etapa: 'Infraestrutura' },
      { descricao: 'Montagem de Pilares e Colunas', etapa: 'Supraestrutura' },
      { descricao: 'Concretagem de Lajes', etapa: 'Supraestrutura' },
      { descricao: 'Elevação de Alvenaria (Tijolos)', etapa: 'Alvenaria' },
      { descricao: 'Montagem de Telhado e Calhas', etapa: 'Cobertura' },
      { descricao: 'Reboco Interno e Externo', etapa: 'Acabamentos' },
      { descricao: 'Assentamento de Pisos e Azulejos', etapa: 'Acabamentos' },
      { descricao: 'Pintura e Vernizes', etapa: 'Acabamentos' },
    ]
  },
  {
    id: 'industrial-padrao',
    nome: 'Modelo Empresarial/Industrial',
    descricao: 'Foco em grandes vãos: Pré-moldados, Estrutura Metálica e Pisos de Alta Resistência.',
    isPremium: false,
    atividades: [
      { descricao: 'Canteiro e Movimentação de Terra', etapa: 'Serviços Preliminares' },
      { descricao: 'Locação e Nivelamento a Laser', etapa: 'Serviços Preliminares' },
      { descricao: 'Fundações Profundas (Estacas)', etapa: 'Infraestrutura' },
      { descricao: 'Montagem de Pilares Pré-moldados', etapa: 'Estrutura' },
      { descricao: 'Içamento de Vigas de Concreto', etapa: 'Estrutura' },
      { descricao: 'Montagem de Lajes Alveolares', etapa: 'Estrutura' },
      { descricao: 'Montagem de Tesouras Metálicas', etapa: 'Cobertura e Fechamento' },
      { descricao: 'Instalação de Telhas Termoacústicas', etapa: 'Cobertura e Fechamento' },
      { descricao: 'Fechamento em Painéis de Concreto', etapa: 'Cobertura e Fechamento' },
      { descricao: 'Preparação de Base e Sub-base', etapa: 'Piso Industrial' },
      { descricao: 'Armadura de Malha e Juntas', etapa: 'Piso Industrial' },
      { descricao: 'Concretagem e Polimento Mecânico', etapa: 'Piso Industrial' },
    ]
  }
];