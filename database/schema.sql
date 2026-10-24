-- =====================================================================
-- Fesare — esquema PostgreSQL (versão inicial)
-- Espelha as entidades de src/domain/types.ts. Ainda não está conectado:
-- nesta etapa o frontend usa armazenamento local (src/data/localDataSource.ts).
-- Para migrar, implemente um DataSource HTTP (src/data/dataSource.ts) que
-- fale com uma API sobre este banco. Chaves de API ficam apenas no servidor.
--
-- Convenções:
--   * is_demo = TRUE marca registros demonstrativos (removíveis em lote).
--   * Relacionamentos só por chave estrangeira — nenhum dado duplicado.
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE team_members (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  role        TEXT NOT NULL,
  is_demo     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE clients (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL CHECK (length(trim(name)) >= 2),
  document    TEXT,              -- CPF/CNPJ
  email       TEXT,
  phone       TEXT,
  city        TEXT,
  notes       TEXT,
  is_demo     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TYPE project_stage AS ENUM (
  'novo_orcamento', 'aguardando_aprovacao', 'aprovado', 'em_producao',
  'pronto_instalacao', 'instalacao_agendada', 'concluido'
);

CREATE TABLE projects (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name               TEXT NOT NULL,
  client_id          UUID NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
  address            TEXT,
  stage              project_stage NOT NULL DEFAULT 'novo_orcamento',
  deadline           DATE,
  installation_date  DATE,
  responsible_id     UUID REFERENCES team_members(id) ON DELETE SET NULL,
  notes              TEXT,
  is_demo            BOOLEAN NOT NULL DEFAULT FALSE,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX projects_client_idx ON projects(client_id);
CREATE INDEX projects_stage_idx ON projects(stage);

-- ---------------------------------------------------------------------
-- Catálogo / base de conhecimento
-- `attributes` (JSONB) recebe os campos técnicos que virão da base real
-- (dimensões mínimas/máximas, perfis compatíveis, espessuras etc.)
-- sem precisar alterar o esquema a cada novo tipo de produto.
-- ---------------------------------------------------------------------
CREATE TYPE catalog_category AS ENUM (
  'esquadrias_aluminio', 'portas_madeira', 'portoes', 'linhas',
  'perfis', 'cores', 'vidros', 'acessorios'
);

CREATE TABLE catalog_items (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category     catalog_category NOT NULL,
  name         TEXT NOT NULL,
  code         TEXT,
  description  TEXT,
  status       TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'arquivado')),
  attributes   JSONB NOT NULL DEFAULT '{}'::jsonb,
  source_file_id UUID,           -- arquivo de origem (importação), ver import_files
  is_demo      BOOLEAN NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (category, code)
);
CREATE INDEX catalog_items_category_idx ON catalog_items(category, status);

-- Arquivos enviados para importação (CSV, XLSX, PDF...). O processamento
-- (inclusive leitura de PDFs por IA) acontece no servidor e registra o
-- resultado aqui — o frontend nunca chama a IA diretamente.
CREATE TABLE import_files (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name     TEXT NOT NULL,
  mime_type     TEXT,
  size_bytes    BIGINT NOT NULL,
  storage_path  TEXT NOT NULL,
  target_category catalog_category,
  status        TEXT NOT NULL DEFAULT 'pendente'
                CHECK (status IN ('pendente', 'processando', 'revisao', 'importado', 'erro')),
  error_message TEXT,
  rows_detected INTEGER,
  rows_imported INTEGER,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at  TIMESTAMPTZ
);
ALTER TABLE catalog_items
  ADD CONSTRAINT catalog_items_source_fk FOREIGN KEY (source_file_id) REFERENCES import_files(id) ON DELETE SET NULL;

-- ---------------------------------------------------------------------
-- Orçamentos
-- ---------------------------------------------------------------------
CREATE TYPE quote_status AS ENUM ('rascunho', 'aguardando_aprovacao', 'aprovado', 'recusado');

CREATE TABLE quotes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  number          TEXT NOT NULL UNIQUE,
  client_id       UUID NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
  project_id      UUID REFERENCES projects(id) ON DELETE RESTRICT,
  status          quote_status NOT NULL DEFAULT 'rascunho',
  discount_type   TEXT NOT NULL DEFAULT 'percent' CHECK (discount_type IN ('percent', 'value')),
  discount_value  NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (discount_value >= 0),
  valid_until     DATE,
  notes           TEXT,
  -- Versão das regras de cálculo usada (preenchida quando o motor existir).
  pricing_engine_version TEXT,
  is_demo         BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX quotes_client_idx ON quotes(client_id);
CREATE INDEX quotes_status_idx ON quotes(status);

CREATE TABLE quote_items (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id         UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  position         INTEGER NOT NULL,
  product_type     TEXT NOT NULL CHECK (product_type IN ('esquadrias_aluminio', 'portas_madeira', 'portoes')),
  catalog_item_id  UUID REFERENCES catalog_items(id) ON DELETE SET NULL,
  model            TEXT NOT NULL,       -- texto do modelo no momento do orçamento
  width_mm         INTEGER NOT NULL CHECK (width_mm BETWEEN 100 AND 20000),
  height_mm        INTEGER NOT NULL CHECK (height_mm BETWEEN 100 AND 20000),
  quantity         INTEGER NOT NULL CHECK (quantity BETWEEN 1 AND 999),
  color            TEXT,
  notes            TEXT,
  unit_price       NUMERIC(12, 2) NOT NULL CHECK (unit_price >= 0),
  -- 'manual' hoje; 'engine' quando o motor de cálculo calcular o valor.
  price_source     TEXT NOT NULL DEFAULT 'manual' CHECK (price_source IN ('manual', 'engine')),
  price_breakdown  JSONB              -- memória de cálculo do motor (futuro)
);
CREATE INDEX quote_items_quote_idx ON quote_items(quote_id);

-- ---------------------------------------------------------------------
-- Tarefas e atividades
-- ---------------------------------------------------------------------
CREATE TABLE tasks (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title           TEXT NOT NULL,
  description     TEXT,
  due_date        DATE,
  priority        TEXT NOT NULL DEFAULT 'media' CHECK (priority IN ('baixa', 'media', 'alta')),
  status          TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'em_andamento', 'concluida')),
  responsible_id  UUID REFERENCES team_members(id) ON DELETE SET NULL,
  project_id      UUID REFERENCES projects(id) ON DELETE SET NULL,
  is_demo         BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX tasks_due_idx ON tasks(due_date) WHERE status <> 'concluida';

CREATE TABLE activities (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kind        TEXT NOT NULL CHECK (kind IN ('quote', 'project', 'task', 'client', 'catalog', 'system')),
  message     TEXT NOT NULL,
  entity_id   UUID,
  is_demo     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX activities_created_idx ON activities(created_at DESC);

CREATE TABLE company_settings (
  id                   SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  company_name         TEXT NOT NULL DEFAULT 'Fesare',
  document             TEXT,
  phone                TEXT,
  email                TEXT,
  address              TEXT,
  quote_validity_days  INTEGER NOT NULL DEFAULT 15 CHECK (quote_validity_days BETWEEN 1 AND 365)
);

-- O calendário não tem tabela própria: os eventos são derivados de
-- projects.installation_date, projects.deadline e tasks.due_date.
