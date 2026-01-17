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
    descricao: 'Foco em Alvenaria, Hidráulica e Acabamentos Finos.',
    isPremium: false,
    atividades: [
      { descricao: 'Instalação de Canteiro e Barracão', etapa: 'Serviços Preliminares' },
      { descricao: 'Locação da Obra (Gabarito)', etapa: 'Serviços Preliminares' },
      { descricao: 'Escavação de Fundações', etapa: 'Infraestrutura' },
      { descricao: 'Concretagem de Sapatas/Blocos', etapa: 'Infraestrutura' },
      { descricao: 'Elevação de Alvenaria (Tijolos)', etapa: 'Alvenaria' },
      { descricao: 'Instalações de Pontos Elétricos', etapa: 'Instalações' },
      { descricao: 'Instalações Hidráulicas de Esgoto', etapa: 'Instalações' },
      { descricao: 'Reboco Interno e Externo', etapa: 'Acabamentos' },
      { descricao: 'Assentamento de Pisos e Azulejos', etapa: 'Acabamentos' },
      { descricao: 'Pintura e Vernizes', etapa: 'Pintura' },
    ]
  },
  {
    id: 'empresarial-galpao',
    nome: 'Empresarial / Galpão',
    descricao: 'Foco em Estrutura Metálica, Pré-moldados e Pisos Industriais.',
    isPremium: false,
    atividades: [
      { descricao: 'Terraplenagem e Nivelamento', etapa: 'Serviços Preliminares' },
      { descricao: 'Locação a Laser', etapa: 'Serviços Preliminares' },
      { descricao: 'Estaqueamento Profundo', etapa: 'Fundação Pesada' },
      { descricao: 'Blocos de Coroamento e Vigas Baldrame', etapa: 'Fundação Pesada' },
      { descricao: 'Içamento de Pilares Pré-moldados', etapa: 'Montagem de Estrutura' },
      { descricao: 'Montagem de Tesouras Metálicas', etapa: 'Montagem de Estrutura' },
      { descricao: 'Instalação de Telhas Termoacústicas', etapa: 'Montagem de Estrutura' },
      { descricao: 'Instalações Elétricas de Alta Tensão', etapa: 'Instalações Industriais' },
      { descricao: 'Pneumática e Rede de Incêndio', etapa: 'Instalações Industriais' },
      { descricao: 'Armadura de Malha e Juntas', etapa: 'Pisos de Alta Resistência' },
      { descricao: 'Concretagem e Polimento Mecânico', etapa: 'Pisos de Alta Resistência' },
    ]
  }
];