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
    id: 'basico',
    nome: 'Modelo Básico (Free)',
    descricao: 'As 5 atividades essenciais para qualquer início de obra.',
    isPremium: false,
    atividades: [
      { descricao: 'Limpeza e preparo do terreno', etapa: 'Serviços Preliminares' },
      { descricao: 'Instalação de tapumes e barracão', etapa: 'Serviços Preliminares' },
      { descricao: 'Locação da obra', etapa: 'Serviços Preliminares' },
      { descricao: 'Escavação de fundações', etapa: 'Fundação' },
      { descricao: 'Armação e concretagem de sapatas/estacas', etapa: 'Fundação' },
    ]
  },
  {
    id: 'residencial',
    nome: 'Residencial Completo',
    descricao: 'Cronograma completo para obras residenciais de médio padrão.',
    isPremium: true,
    atividades: [
      { descricao: 'Infraestrutura de esgoto primário', etapa: 'Fundação' },
      { descricao: 'Vigas baldrame e impermeabilização', etapa: 'Fundação' },
      { descricao: 'Levantamento de alvenaria estrutural/vedação', etapa: 'Estrutura' },
      { descricao: 'Laje de piso e cobertura', etapa: 'Estrutura' },
      { descricao: 'Instalações elétricas de teto e paredes', etapa: 'Instalações Elétricas' },
      { descricao: 'Tubulações de água fria e quente', etapa: 'Instalações Hidráulicas' },
      { descricao: 'Reboco interno e externo', etapa: 'Revestimento' },
      { descricao: 'Contrapiso e regularização', etapa: 'Revestimento' },
      { descricao: 'Assentamento de pisos e azulejos', etapa: 'Acabamento' },
    ]
  },
  {
    id: 'comercial',
    nome: 'Comercial / Galpão',
    descricao: 'Focado em estruturas metálicas, pisos industriais e Drywall.',
    isPremium: true,
    atividades: [
      { descricao: 'Terraplenagem e compactação', etapa: 'Serviços Preliminares' },
      { descricao: 'Montagem de estrutura metálica', etapa: 'Estrutura' },
      { descricao: 'Execução de piso industrial polido', etapa: 'Revestimento' },
      { descricao: 'Fechamento lateral em painéis', etapa: 'Alvenaria' },
      { descricao: 'Divisórias em Drywall', etapa: 'Acabamento' },
      { descricao: 'Instalação de rede de combate a incêndio', etapa: 'Instalações Hidráulicas' },
    ]
  },
  {
    id: 'reforma',
    nome: 'Reforma de Interiores',
    descricao: 'Ideal para apartamentos e salas comerciais.',
    isPremium: true,
    atividades: [
      { descricao: 'Demolição e retirada de entulho', etapa: 'Serviços Preliminares' },
      { descricao: 'Abertura de rasgos para novas instalações', etapa: 'Instalações Elétricas' },
      { descricao: 'Nivelamento de paredes com gesso/massa', etapa: 'Revestimento' },
      { descricao: 'Pintura geral e texturas', etapa: 'Pintura' },
      { descricao: 'Instalação de luminárias e tomadas', etapa: 'Instalações Elétricas' },
      { descricao: 'Limpeza pós-obra detalhada', etapa: 'Limpeza de Obra' },
    ]
  }
];