import type { BaseEntity, CompanySettings, ID, NewEntity } from '@/domain/types';
import { newId } from '@/lib/id';
import { buildDemoData } from './demo/seed';
import { type CollectionName, type Collections, DataError, type DataSource, type Repository } from './dataSource';

const PREFIX = 'fesare:v1:';
/** Prefixo usado na primeira versão (nome digitado incorretamente). Migrado automaticamente. */
const LEGACY_PREFIX = 'fezari:v1:';
const INIT_KEY = `${PREFIX}initialized`;
const SETTINGS_KEY = `${PREFIX}settings`;

const COLLECTIONS: CollectionName[] = ['clients', 'projects', 'quotes', 'tasks', 'catalog', 'team', 'activities'];

export const DEFAULT_SETTINGS: CompanySettings = {
  companyName: 'Fesare',
  quoteValidityDays: 15,
};

/** Copia dados salvos com o prefixo antigo para o novo, sem perder registros. */
function migrateLegacyKeys() {
  if (localStorage.getItem(INIT_KEY) !== null || localStorage.getItem(`${LEGACY_PREFIX}initialized`) === null) return;
  for (const suffix of [...COLLECTIONS, 'settings', 'initialized']) {
    const value = localStorage.getItem(LEGACY_PREFIX + suffix);
    if (value !== null) localStorage.setItem(PREFIX + suffix, value);
    localStorage.removeItem(LEGACY_PREFIX + suffix);
  }
  // Corrige o nome padrão gravado pela versão anterior.
  try {
    const s = JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? 'null');
    if (s && s.companyName === 'Fezari') localStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...s, companyName: 'Fesare' }));
  } catch {
    /* configurações corrompidas são tratadas na leitura */
  }
}


function read<T>(key: string, fallback: T): T {
  const raw = localStorage.getItem(key);
  if (raw === null) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    throw new DataError(`Os dados locais de "${key.replace(PREFIX, '')}" estão corrompidos.`);
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    throw new DataError('Não foi possível salvar: o armazenamento do navegador está cheio ou bloqueado.');
  }
}

function createRepository<T extends BaseEntity>(name: CollectionName): Repository<T> {
  const key = PREFIX + name;
  const all = () => read<T[]>(key, []);

  return {
    async list() {
      return all();
    },
    async create(input: NewEntity<T>) {
      const now = new Date().toISOString();
      const entity = { ...input, id: newId(), createdAt: now, updatedAt: now, isDemo: input.isDemo ?? false } as T;
      write(key, [...all(), entity]);
      return entity;
    },
    async update(id: ID, patch: Partial<NewEntity<T>>) {
      const items = all();
      const index = items.findIndex((i) => i.id === id);
      if (index < 0) throw new DataError('Registro não encontrado. Ele pode ter sido removido.');
      const updated = { ...items[index], ...patch, id, updatedAt: new Date().toISOString() } as T;
      items[index] = updated;
      write(key, items);
      return updated;
    },
    async remove(id: ID) {
      const items = all();
      if (!items.some((i) => i.id === id)) throw new DataError('Registro não encontrado.');
      write(key, items.filter((i) => i.id !== id));
    },
  };
}

function writeDemo(keepReal: boolean) {
  const demo = buildDemoData(new Date());
  for (const name of COLLECTIONS) {
    const real = keepReal ? read<BaseEntity[]>(PREFIX + name, []).filter((i) => !i.isDemo) : [];
    write(PREFIX + name, [...(demo[name] as BaseEntity[]), ...real]);
  }
}

export function createLocalDataSource(): DataSource {
  migrateLegacyKeys();
  // Primeira execução: carrega os dados demonstrativos.
  if (localStorage.getItem(INIT_KEY) === null) {
    writeDemo(false);
    localStorage.setItem(INIT_KEY, new Date().toISOString());
  }

  return {
    clients: createRepository('clients'),
    projects: createRepository('projects'),
    quotes: createRepository('quotes'),
    tasks: createRepository('tasks'),
    catalog: createRepository('catalog'),
    team: createRepository('team'),
    activities: createRepository('activities'),
    async getSettings() {
      return { ...DEFAULT_SETTINGS, ...read<Partial<CompanySettings>>(SETTINGS_KEY, {}) };
    },
    async saveSettings(settings) {
      write(SETTINGS_KEY, settings);
      return settings;
    },
    async clearDemoData() {
      for (const name of COLLECTIONS) {
        write(PREFIX + name, read<BaseEntity[]>(PREFIX + name, []).filter((i) => !i.isDemo));
      }
    },
    async restoreDemoData() {
      writeDemo(true);
    },
  };
}

/** Apaga todos os dados locais (usado na recuperação de erros). */
export function resetLocalStorage() {
  for (const name of COLLECTIONS) localStorage.removeItem(PREFIX + name);
  localStorage.removeItem(SETTINGS_KEY);
  localStorage.removeItem(INIT_KEY);
}

export async function loadAll(ds: DataSource): Promise<Collections> {
  const [clients, projects, quotes, tasks, catalog, team, activities] = await Promise.all([
    ds.clients.list(),
    ds.projects.list(),
    ds.quotes.list(),
    ds.tasks.list(),
    ds.catalog.list(),
    ds.team.list(),
    ds.activities.list(),
  ]);
  return { clients, projects, quotes, tasks, catalog, team, activities };
}
