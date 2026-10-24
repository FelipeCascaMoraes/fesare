/**
 * Entidades do domínio Fesare.
 * Espelham as tabelas de database/schema.sql. Os relacionamentos são feitos
 * apenas por id, para que nenhum dado seja duplicado entre módulos.
 */

export type ID = string;

export interface BaseEntity {
  id: ID;
  createdAt: string; // ISO
  updatedAt: string; // ISO
  /** true = registro de demonstração (pode ser removido em Configurações). */
  isDemo: boolean;
}

export interface TeamMember extends BaseEntity {
  name: string;
  role: string;
}

export interface Client extends BaseEntity {
  name: string;
  document?: string; // CPF/CNPJ
  email?: string;
  phone?: string;
  city?: string;
  notes?: string;
}

export const PROJECT_STAGES = [
  'novo_orcamento',
  'aguardando_aprovacao',
  'aprovado',
  'em_producao',
  'pronto_instalacao',
  'instalacao_agendada',
  'concluido',
] as const;
export type ProjectStage = (typeof PROJECT_STAGES)[number];

export interface Project extends BaseEntity {
  name: string;
  clientId: ID;
  address?: string;
  stage: ProjectStage;
  deadline?: string; // yyyy-mm-dd
  installationDate?: string; // yyyy-mm-dd
  responsibleId?: ID;
  notes?: string;
}

export const CATALOG_CATEGORIES = [
  'esquadrias_aluminio',
  'portas_madeira',
  'portoes',
  'linhas',
  'perfis',
  'cores',
  'vidros',
  'acessorios',
] as const;
export type CatalogCategory = (typeof CATALOG_CATEGORIES)[number];

export type CatalogStatus = 'ativo' | 'arquivado';

export interface CatalogItem extends BaseEntity {
  category: CatalogCategory;
  name: string;
  code?: string;
  description?: string;
  status: CatalogStatus;
}

export const QUOTE_STATUSES = ['rascunho', 'aguardando_aprovacao', 'aprovado', 'recusado'] as const;
export type QuoteStatus = (typeof QUOTE_STATUSES)[number];

export type ProductType = 'esquadrias_aluminio' | 'portas_madeira' | 'portoes';

export interface QuoteItem {
  id: ID;
  productType: ProductType;
  model: string;
  widthMm: number;
  heightMm: number;
  quantity: number;
  color?: string;
  notes?: string;
  /**
   * Valor unitário informado manualmente. Enquanto o motor de cálculo
   * não existe, nenhum preço é calculado automaticamente.
   */
  unitPrice: number;
}

export type DiscountType = 'percent' | 'value';

export interface Quote extends BaseEntity {
  number: string;
  clientId: ID;
  projectId?: ID;
  status: QuoteStatus;
  items: QuoteItem[];
  discountType: DiscountType;
  discountValue: number;
  validUntil?: string;
  notes?: string;
}

export const TASK_PRIORITIES = ['baixa', 'media', 'alta'] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];
export const TASK_STATUSES = ['pendente', 'em_andamento', 'concluida'] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export interface Task extends BaseEntity {
  title: string;
  description?: string;
  dueDate?: string;
  priority: TaskPriority;
  status: TaskStatus;
  responsibleId?: ID;
  projectId?: ID;
}

export type ActivityKind = 'quote' | 'project' | 'task' | 'client' | 'catalog' | 'system';

export interface Activity extends BaseEntity {
  kind: ActivityKind;
  message: string;
  entityId?: ID;
}

export interface CompanySettings {
  companyName: string;
  document?: string;
  phone?: string;
  email?: string;
  address?: string;
  quoteValidityDays: number;
}

/** Campos gerados pelo repositório. */
export type NewEntity<T extends BaseEntity> = Omit<T, 'id' | 'createdAt' | 'updatedAt' | 'isDemo'> & {
  isDemo?: boolean;
};
