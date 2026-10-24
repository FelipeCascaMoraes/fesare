import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type {
  ActivityKind,
  CatalogItem,
  CatalogStatus,
  Client,
  CompanySettings,
  ID,
  NewEntity,
  Project,
  ProjectStage,
  Quote,
  Task,
  TaskStatus,
} from '@/domain/types';
import { STAGE_LABELS, TASK_STATUS_LABELS } from '@/domain/labels';
import { nextQuoteNumber } from '@/domain/quote';
import { type Collections, DataError, type DataSource } from './dataSource';
import { createLocalDataSource, DEFAULT_SETTINGS, loadAll } from './localDataSource';

type Status = 'loading' | 'ready' | 'error';

export interface DataContextValue extends Collections {
  status: Status;
  error?: string;
  settings: CompanySettings;
  reload(): Promise<void>;
  saveClient(input: NewEntity<Client>, id?: ID): Promise<Client>;
  removeClient(id: ID): Promise<void>;
  saveProject(input: NewEntity<Project>, id?: ID): Promise<Project>;
  moveProject(id: ID, stage: ProjectStage): Promise<void>;
  removeProject(id: ID): Promise<void>;
  saveQuote(input: Omit<NewEntity<Quote>, 'number'>, id?: ID): Promise<Quote>;
  removeQuote(id: ID): Promise<void>;
  saveTask(input: NewEntity<Task>, id?: ID): Promise<Task>;
  setTaskStatus(id: ID, status: TaskStatus): Promise<void>;
  removeTask(id: ID): Promise<void>;
  saveCatalogItem(input: NewEntity<CatalogItem>, id?: ID): Promise<CatalogItem>;
  setCatalogStatus(id: ID, status: CatalogStatus): Promise<void>;
  saveSettings(settings: CompanySettings): Promise<void>;
  clearDemoData(): Promise<void>;
  restoreDemoData(): Promise<void>;
}

const EMPTY: Collections = { clients: [], projects: [], quotes: [], tasks: [], catalog: [], team: [], activities: [] };

const DataContext = createContext<DataContextValue | null>(null);

export function DataProvider({ children, source }: { children: ReactNode; source?: DataSource }) {
  const dsRef = useRef<DataSource | null>(source ?? null);
  const [data, setData] = useState<Collections>(EMPTY);
  const [settings, setSettings] = useState<CompanySettings>(DEFAULT_SETTINGS);
  const [status, setStatus] = useState<Status>('loading');
  const [error, setError] = useState<string>();

  const ds = () => {
    if (!dsRef.current) dsRef.current = createLocalDataSource();
    return dsRef.current;
  };

  const reload = useCallback(async () => {
    setStatus('loading');
    try {
      const [all, s] = await Promise.all([loadAll(ds()), ds().getSettings()]);
      setData(all);
      setSettings(s);
      setStatus('ready');
      setError(undefined);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro desconhecido ao carregar os dados.');
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const log = useCallback(async (kind: ActivityKind, message: string, entityId?: ID) => {
    const activity = await ds().activities.create({ kind, message, entityId });
    setData((d) => ({ ...d, activities: [...d.activities, activity] }));
  }, []);

  const value = useMemo<DataContextValue>(() => {
    const replace = <K extends keyof Collections>(key: K, item: Collections[K][number]) =>
      setData((d) => {
        const list = d[key] as Collections[K][number][];
        const exists = list.some((i) => i.id === item.id);
        return { ...d, [key]: exists ? list.map((i) => (i.id === item.id ? item : i)) : [...list, item] };
      });
    const drop = (key: keyof Collections, id: ID) =>
      setData((d) => ({ ...d, [key]: (d[key] as { id: ID }[]).filter((i) => i.id !== id) }));

    return {
      ...data,
      status,
      error,
      settings,
      reload,

      async saveClient(input, id) {
        const saved = id ? await ds().clients.update(id, input) : await ds().clients.create(input);
        replace('clients', saved);
        await log('client', `Cliente "${saved.name}" ${id ? 'atualizado' : 'cadastrado'}`, saved.id);
        return saved;
      },
      async removeClient(id) {
        const inUse = data.projects.some((p) => p.clientId === id) || data.quotes.some((q) => q.clientId === id);
        if (inUse) throw new DataError('Este cliente possui obras ou orçamentos vinculados e não pode ser excluído.');
        const name = data.clients.find((c) => c.id === id)?.name;
        await ds().clients.remove(id);
        drop('clients', id);
        await log('client', `Cliente "${name}" excluído`);
      },

      async saveProject(input, id) {
        const previous = id ? data.projects.find((p) => p.id === id) : undefined;
        const saved = id ? await ds().projects.update(id, input) : await ds().projects.create(input);
        replace('projects', saved);
        const msg = !id
          ? `Obra "${saved.name}" criada`
          : previous && previous.stage !== saved.stage
            ? `Obra "${saved.name}" movida para ${STAGE_LABELS[saved.stage]}`
            : `Obra "${saved.name}" atualizada`;
        await log('project', msg, saved.id);
        return saved;
      },
      async moveProject(id, stage) {
        const current = data.projects.find((p) => p.id === id);
        if (!current || current.stage === stage) return;
        const saved = await ds().projects.update(id, { stage });
        replace('projects', saved);
        await log('project', `Obra "${saved.name}" movida para ${STAGE_LABELS[stage]}`, id);
      },
      async removeProject(id) {
        if (data.quotes.some((q) => q.projectId === id))
          throw new DataError('Esta obra possui orçamentos vinculados e não pode ser excluída.');
        const name = data.projects.find((p) => p.id === id)?.name;
        await ds().projects.remove(id);
        drop('projects', id);
        // Tarefas da obra continuam existindo, apenas sem vínculo.
        for (const t of data.tasks.filter((t) => t.projectId === id)) {
          replace('tasks', await ds().tasks.update(t.id, { projectId: undefined }));
        }
        await log('project', `Obra "${name}" excluída`);
      },

      async saveQuote(input, id) {
        const previous = id ? data.quotes.find((q) => q.id === id) : undefined;
        const saved = id
          ? await ds().quotes.update(id, input)
          : await ds().quotes.create({ ...input, number: nextQuoteNumber(data.quotes.map((q) => q.number)) });
        replace('quotes', saved);
        const msg = !id
          ? `Orçamento ${saved.number} criado`
          : previous?.status !== saved.status && saved.status === 'aguardando_aprovacao'
            ? `Orçamento ${saved.number} enviado para aprovação`
            : `Orçamento ${saved.number} atualizado`;
        await log('quote', msg, saved.id);
        return saved;
      },
      async removeQuote(id) {
        const q = data.quotes.find((x) => x.id === id);
        await ds().quotes.remove(id);
        drop('quotes', id);
        await log('quote', `Orçamento ${q?.number} excluído`);
      },

      async saveTask(input, id) {
        const saved = id ? await ds().tasks.update(id, input) : await ds().tasks.create(input);
        replace('tasks', saved);
        await log('task', `Tarefa "${saved.title}" ${id ? 'atualizada' : 'criada'}`, saved.id);
        return saved;
      },
      async setTaskStatus(id, status) {
        const saved = await ds().tasks.update(id, { status });
        replace('tasks', saved);
        await log('task', `Tarefa "${saved.title}": ${TASK_STATUS_LABELS[status]}`, id);
      },
      async removeTask(id) {
        const title = data.tasks.find((t) => t.id === id)?.title;
        await ds().tasks.remove(id);
        drop('tasks', id);
        await log('task', `Tarefa "${title}" excluída`);
      },

      async saveCatalogItem(input, id) {
        const saved = id ? await ds().catalog.update(id, input) : await ds().catalog.create(input);
        replace('catalog', saved);
        await log('catalog', `Item "${saved.name}" ${id ? 'atualizado' : 'cadastrado'} no catálogo`, saved.id);
        return saved;
      },
      async setCatalogStatus(id, status) {
        const saved = await ds().catalog.update(id, { status });
        replace('catalog', saved);
        await log('catalog', `Item "${saved.name}" ${status === 'arquivado' ? 'arquivado' : 'restaurado'}`, id);
      },

      async saveSettings(s) {
        setSettings(await ds().saveSettings(s));
      },
      async clearDemoData() {
        await ds().clearDemoData();
        await reload();
      },
      async restoreDemoData() {
        await ds().restoreDemoData();
        await reload();
      },
    };
  }, [data, status, error, settings, reload, log]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData(): DataContextValue {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData deve ser usado dentro de <DataProvider>');
  return ctx;
}

/** Utilitário para montar mapas id → entidade (evita buscas repetidas nas listas). */
export function byId<T extends { id: ID }>(items: T[]): Map<ID, T> {
  return new Map(items.map((i) => [i.id, i]));
}
