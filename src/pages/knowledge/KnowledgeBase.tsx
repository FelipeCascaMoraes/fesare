import { useMemo, useState } from 'react';
import { Archive, ArchiveRestore, BookOpen, Eye, Pencil, Plus, Search, Upload } from 'lucide-react';
import { useData } from '@/data/DataContext';
import { Badge, Banner, Button, Card, DemoTag, EmptyState, IconButton, PageHeader } from '@/components/ui';
import { ConfirmDialog, Modal } from '@/components/Modal';
import { SelectField, TextAreaField, TextField, toFormValues, useForm } from '@/components/forms';
import { useToast } from '@/components/Toast';
import { catalogItemSchema } from '@/domain/schemas';
import { CATEGORY_LABELS } from '@/domain/labels';
import { CATALOG_CATEGORIES, type CatalogCategory, type CatalogItem } from '@/domain/types';
import { formatDateTime } from '@/domain/dates';
import { CATEGORY_ICONS, type CatalogSection } from '@/layout/navigation';
import { ImportDialog } from './ImportDialog';

function ItemForm({ item, categories, defaultCategory, onClose }: {
  item?: CatalogItem;
  categories: readonly CatalogCategory[];
  defaultCategory?: CatalogCategory;
  onClose: () => void;
}) {
  const { saveCatalogItem } = useData();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const blank = { category: defaultCategory ?? (categories.length === 1 ? categories[0] : ''), name: '', code: '', description: '' };
  const form = useForm(catalogItemSchema, toFormValues(blank, item));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = form.validate();
    if (!data) return;
    setBusy(true);
    try {
      await saveCatalogItem({ ...data, status: item?.status ?? 'ativo', isDemo: item?.isDemo }, item?.id);
      toast.success(item ? 'Item atualizado.' : 'Item cadastrado.');
      onClose();
    } catch (err) {
      toast.error(err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={item ? 'Editar item' : 'Cadastrar item'}
      description="Campos básicos. Atributos técnicos (dimensões, perfis, preços) serão definidos quando a base real for importada."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button type="submit" form="item-form" loading={busy}>Salvar item</Button>
        </>
      }
    >
      <form id="item-form" className="form-grid" onSubmit={submit} noValidate>
        <SelectField label="Categoria" required {...form.bind('category')}>
          <option value="">Selecione…</option>
          {categories.map((c) => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
        </SelectField>
        <TextField label="Código" placeholder="Opcional" {...form.bind('code')} />
        <TextField label="Nome" required className="span-2" {...form.bind('name')} />
        <TextAreaField label="Descrição" className="span-2" {...form.bind('description')} />
      </form>
    </Modal>
  );
}

type StatusFilter = 'ativo' | 'arquivado' | 'todos';

export function KnowledgeBase({ section }: { section?: CatalogSection }) {
  const { catalog, setCatalogStatus } = useData();
  const toast = useToast();
  const categories: readonly CatalogCategory[] = section?.categories ?? CATALOG_CATEGORIES;

  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<CatalogCategory | ''>('');
  const [status, setStatus] = useState<StatusFilter>('ativo');
  const [viewing, setViewing] = useState<CatalogItem>();
  const [formItem, setFormItem] = useState<CatalogItem | null | undefined>(undefined);
  const [archiving, setArchiving] = useState<CatalogItem>();
  const [importOpen, setImportOpen] = useState(false);

  const inScope = catalog.filter((i) => categories.includes(i.category));
  const countFor = (c: CatalogCategory) => inScope.filter((i) => i.category === c && i.status === 'ativo').length;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return inScope
      .filter((i) => !category || i.category === category)
      .filter((i) => status === 'todos' || i.status === status)
      .filter((i) => !q || [i.name, i.code, i.description].some((v) => v?.toLowerCase().includes(q)))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [inScope, category, status, query]);

  const hasDemo = inScope.some((i) => i.isDemo);
  const title = section?.label ?? 'Base de conhecimento';

  return (
    <div className="page">
      <PageHeader
        title={title}
        subtitle={section?.description ?? 'Catálogo técnico de produtos, linhas, perfis, cores, vidros e acessórios da Fesare.'}
        actions={
          <>
            <Button variant="secondary" icon={Upload} onClick={() => setImportOpen(true)}>Importar dados</Button>
            <Button icon={Plus} onClick={() => setFormItem(null)}>Cadastrar item</Button>
          </>
        }
      />

      {hasDemo && (
        <Banner tone="demo" title="Base de conhecimento ainda não importada.">
          Os itens marcados com <DemoTag /> são apenas exemplos de estrutura e serão substituídos pela base real.
        </Banner>
      )}

      {categories.length > 1 && (
        <div className="grid grid-cards">
          {categories.map((c) => {
            const Icon = CATEGORY_ICONS[c];
            const n = countFor(c);
            return (
              <button
                key={c}
                type="button"
                className={`card cat-card ${category === c ? 'active' : ''}`}
                onClick={() => setCategory((cur) => (cur === c ? '' : c))}
                aria-pressed={category === c}
              >
                <div className="cat-art"><Icon /></div>
                <div>
                  <div className="cat-name">{CATEGORY_LABELS[c]}</div>
                  <div className="cat-count">{n} {n === 1 ? 'registro ativo' : 'registros ativos'}</div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      <div className="toolbar">
        <div className="search">
          <Search />
          <input className="input" placeholder="Pesquisar por nome, código ou descrição" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Pesquisar no catálogo" />
        </div>
        {categories.length > 1 && (
          <select className="select" value={category} onChange={(e) => setCategory(e.target.value as CatalogCategory | '')} aria-label="Filtrar por categoria">
            <option value="">Todas as categorias</option>
            {categories.map((c) => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
          </select>
        )}
        <div className="segmented" role="group" aria-label="Status">
          {(['ativo', 'arquivado', 'todos'] as const).map((s) => (
            <button key={s} type="button" className={status === s ? 'active' : ''} onClick={() => setStatus(s)} aria-pressed={status === s}>
              {s === 'ativo' ? 'Ativos' : s === 'arquivado' ? 'Arquivados' : 'Todos'}
            </button>
          ))}
        </div>
      </div>

      <Card>
        {inScope.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="Nenhum registro nesta seção"
            description="Cadastre itens manualmente ou prepare os arquivos para a importação da base de conhecimento."
            action={<div className="row"><Button variant="secondary" icon={Upload} onClick={() => setImportOpen(true)}>Importar dados</Button><Button icon={Plus} onClick={() => setFormItem(null)}>Cadastrar item</Button></div>}
          />
        ) : filtered.length === 0 ? (
          <EmptyState icon={Search} title="Nenhum item encontrado" description="Ajuste a pesquisa ou os filtros." />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Item</th><th>Código</th><th>Categoria</th><th>Status</th><th /></tr></thead>
              <tbody>
                {filtered.map((i) => (
                  <tr key={i.id}>
                    <td><div className="cell-main">{i.name} <DemoTag show={i.isDemo} /></div></td>
                    <td className="muted">{i.code || '—'}</td>
                    <td>{CATEGORY_LABELS[i.category]}</td>
                    <td>{i.status === 'ativo' ? <Badge tone="success" dot>Ativo</Badge> : <Badge tone="muted" dot>Arquivado</Badge>}</td>
                    <td className="actions">
                      <IconButton icon={Eye} label={`Visualizar ${i.name}`} onClick={() => setViewing(i)} />
                      <IconButton icon={Pencil} label={`Editar ${i.name}`} onClick={() => setFormItem(i)} />
                      {i.status === 'ativo' ? (
                        <IconButton icon={Archive} label={`Arquivar ${i.name}`} onClick={() => setArchiving(i)} />
                      ) : (
                        <IconButton
                          icon={ArchiveRestore}
                          label={`Restaurar ${i.name}`}
                          onClick={async () => {
                            try { await setCatalogStatus(i.id, 'ativo'); toast.success('Item restaurado.'); } catch (e) { toast.error(e); }
                          }}
                        />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={!!viewing} onClose={() => setViewing(undefined)} title={viewing?.name ?? ''} footer={<Button variant="secondary" onClick={() => setViewing(undefined)}>Fechar</Button>}>
        {viewing && (
          <dl className="detail-list">
            <dt>Categoria</dt><dd>{CATEGORY_LABELS[viewing.category]}</dd>
            <dt>Código</dt><dd>{viewing.code || '—'}</dd>
            <dt>Status</dt><dd>{viewing.status === 'ativo' ? 'Ativo' : 'Arquivado'}</dd>
            <dt>Descrição</dt><dd>{viewing.description || '—'}</dd>
            <dt>Origem</dt><dd>{viewing.isDemo ? 'Demonstrativo' : 'Cadastro manual'}</dd>
            <dt>Atualizado em</dt><dd>{formatDateTime(viewing.updatedAt)}</dd>
          </dl>
        )}
      </Modal>

      {formItem !== undefined && (
        <ItemForm item={formItem ?? undefined} categories={categories} defaultCategory={category || undefined} onClose={() => setFormItem(undefined)} />
      )}

      <ConfirmDialog
        open={!!archiving}
        onClose={() => setArchiving(undefined)}
        title="Arquivar item"
        danger={false}
        confirmLabel="Arquivar"
        message={<>O item <strong>{archiving?.name}</strong> deixará de aparecer nas listas ativas, mas pode ser restaurado a qualquer momento.</>}
        onConfirm={async () => {
          await setCatalogStatus(archiving!.id, 'arquivado');
          toast.success('Item arquivado.');
        }}
      />

      <ImportDialog open={importOpen} onClose={() => setImportOpen(false)} defaultCategory={categories.length === 1 ? categories[0] : category || undefined} />
    </div>
  );
}
