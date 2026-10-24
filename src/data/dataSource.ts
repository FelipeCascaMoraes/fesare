import type {
  Activity,
  BaseEntity,
  CatalogItem,
  Client,
  CompanySettings,
  ID,
  NewEntity,
  Project,
  Quote,
  Task,
  TeamMember,
} from '@/domain/types';

/**
 * Contrato de acesso a dados. A interface é assíncrona de propósito:
 * hoje a implementação usa o armazenamento local do navegador
 * (localDataSource.ts); depois será substituída por uma API HTTP com banco
 * PostgreSQL (database/schema.sql) sem mudar as telas.
 */
export interface Repository<T extends BaseEntity> {
  list(): Promise<T[]>;
  create(input: NewEntity<T>): Promise<T>;
  update(id: ID, patch: Partial<NewEntity<T>>): Promise<T>;
  remove(id: ID): Promise<void>;
}

export interface Collections {
  clients: Client[];
  projects: Project[];
  quotes: Quote[];
  tasks: Task[];
  catalog: CatalogItem[];
  team: TeamMember[];
  activities: Activity[];
}

export type CollectionName = keyof Collections;

export interface DataSource {
  clients: Repository<Client>;
  projects: Repository<Project>;
  quotes: Repository<Quote>;
  tasks: Repository<Task>;
  catalog: Repository<CatalogItem>;
  team: Repository<TeamMember>;
  activities: Repository<Activity>;
  getSettings(): Promise<CompanySettings>;
  saveSettings(settings: CompanySettings): Promise<CompanySettings>;
  /** Remove todos os registros marcados como demonstrativos. */
  clearDemoData(): Promise<void>;
  /** Recarrega os registros demonstrativos (mantém os registros reais). */
  restoreDemoData(): Promise<void>;
}

export class DataError extends Error {}
