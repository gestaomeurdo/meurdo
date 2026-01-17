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
    nome: 'Modelo Residencial Padrão',
    descricao: 'Cronograma completo: Preliminares, Infra, Supra, Alvenaria e Acabamentos.',
    isPremium: false,
    atividades: [
      // Serviços Preliminares
      { descricao: 'Instalação de Canteiro e Barracão', etapa: 'Serviços Preliminares' },
      { descricao: 'Locação da Obra (Gabarito)', etapa: 'Serviços Preliminares' },
      { descricao: 'Limpeza e Terraplenagem', etapa: 'Serviços Preliminares' },
      // Infraestrutura
      { descricao: 'Escavação de Fundações', etapa: 'Infraestrutura' },
      { descricao: 'Armação de Ferragens (Fundação)', etapa: 'Infraestrutura' },
      { descricao: 'Concretagem de Sapatas/Blocos', etapa: 'Infraestrutura' },
      // Supraestrutura
      { descricao: 'Montagem de Pilares e Colunas', etapa: 'Supraestrutura' },
      { descricao: 'Formas e Ferragens de Vigas', etapa: 'Supraestrutura' },
      { descricao: 'Concretagem de Lajes', etapa: 'Supraestrutura' },
      // Alvenaria e Cobertura
      { descricao: 'Elevação de Alvenaria (Tijolos)', etapa: 'Alvenaria e Cobertura' },
      { descricao: 'Execução de Vergas e Contravergas', etapa: 'Alvenaria e Cobertura' },
      { descricao: 'Montagem de Telhado e Calhas', etapa: 'Alvenaria e Cobertura' },
      // Acabamentos
      { descricao: 'Reboco Interno e Externo', etapa: 'Acabamentos' },
      { descricao: 'Assentamento de Pisos e Azulejos', etapa: 'Acabamentos' },
      { descricao: 'Pintura e Vernizes', etapa: 'Acabamentos' },
    ]
  },
  {
    id: 'reforma-simples',
    nome: 'Reforma de Interiores',
    descricao: 'Focado em demolição, gesso e pintura.',
    isPremium: true,
    atividades: [
      { descricao: 'Proteção de pisos e elevadores', etapa: 'Preliminares' },
      { descricao: 'Demolição de alvenarias e revestimentos', etapa: 'Demolição' },
      { descricao: 'Instalações elétricas e pontos de luz', etapa: 'Instalações' },
      { descricao: 'Nivelamento de paredes e teto (Gesso)', etapa: 'Acabamento' },
      { descricao: 'Pintura e Texturização', etapa: 'Pintura' },
    ]
  }
];