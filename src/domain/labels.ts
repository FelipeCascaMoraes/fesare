import type {
  CatalogCategory,
  ProductType,
  ProjectStage,
  QuoteStatus,
  TaskPriority,
  TaskStatus,
} from './types';

export const STAGE_LABELS: Record<ProjectStage, string> = {
  novo_orcamento: 'Novo orçamento',
  aguardando_aprovacao: 'Aguardando aprovação',
  aprovado: 'Aprovado',
  em_producao: 'Em produção',
  pronto_instalacao: 'Pronto para instalação',
  instalacao_agendada: 'Instalação agendada',
  concluido: 'Concluído',
};

export const QUOTE_STATUS_LABELS: Record<QuoteStatus, string> = {
  rascunho: 'Rascunho',
  aguardando_aprovacao: 'Aguardando aprovação',
  aprovado: 'Aprovado',
  recusado: 'Recusado',
};

export const CATEGORY_LABELS: Record<CatalogCategory, string> = {
  esquadrias_aluminio: 'Esquadrias de alumínio',
  portas_madeira: 'Portas de madeira',
  portoes: 'Portões',
  linhas: 'Linhas',
  perfis: 'Perfis',
  cores: 'Cores e acabamentos',
  vidros: 'Vidros',
  acessorios: 'Acessórios',
};

export const PRODUCT_TYPE_LABELS: Record<ProductType, string> = {
  esquadrias_aluminio: 'Esquadria de alumínio',
  portas_madeira: 'Porta de madeira',
  portoes: 'Portão',
};

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  baixa: 'Baixa',
  media: 'Média',
  alta: 'Alta',
};

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  pendente: 'Pendente',
  em_andamento: 'Em andamento',
  concluida: 'Concluída',
};
