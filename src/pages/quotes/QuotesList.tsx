import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, FileText, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { byId, useData } from '@/data/DataContext';
import { Button, Card, DemoTag, EmptyState, IconButton, PageHeader } from '@/components/ui';
import { ConfirmDialog } from '@/components/Modal';
import { QuoteStatusBadge } from '@/components/statusBadges';
import { useToast } from '@/components/Toast';
import { QUOTE_STATUS_LABELS } from '@/domain/labels';
import { QUOTE_STATUSES, type Quote, type QuoteStatus } from '@/domain/types';
import { formatCurrency, formatDate } from '@/domain/dates';
import { quoteTotals } from '@/domain/quote';

export function QuotesList() {
  const { quotes, clients, projects, removeQuote } = useData();
  const toast = useToast();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const status = (params.get('status') ?? '') as QuoteStatus | '';
  const [query, setQuery] = useState('');
  const [deleting, setDeleting] = useState<Quote>();

  const clientMap = byId(clients);
  const projectMap = byId(projects);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return [...quotes]
      .filter((x) => !status || x.status === status)
      .filter((x) => !q || x.number.toLowerCase().includes(q) || clientMap.get(x.clientId)?.name.toLowerCase().includes(q))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [quotes, status, query, clientMap]);

  const setStatus = (s: string) => setParams(s ? { status: s } : {});

  return (
    <div className="page">
      <PageHeader
        title="Orçamentos"
        subtitle="Histórico de orçamentos. Abra um rascunho para editar ou visualize antes de gerar o documento."
        actions={<Button icon={Plus} onClick={() => navigate('/orcamentos/novo')}>Novo orçamento</Button>}
      />

      <div className="toolbar">
        <div className="chips" role="group" aria-label="Filtrar por status">
          {(['', ...QUOTE_STATUSES] as const).map((s) => (
            <button key={s || 'todos'} type="button" className={`chip ${status === s ? 'active' : ''}`} aria-pressed={status === s} onClick={() => setStatus(s)}>
              {s ? QUOTE_STATUS_LABELS[s] : 'Todos'}
              <span className="count">{s ? quotes.filter((q) => q.status === s).length : quotes.length}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="toolbar">
        <div className="search">
          <Search />
          <input className="input" placeholder="Buscar por número ou cliente" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Buscar orçamentos" />
        </div>
      </div>

      <Card>
        {quotes.length === 0 ? (
          <EmptyState icon={FileText} title="Nenhum orçamento ainda" description="Crie o primeiro orçamento selecionando um cliente e adicionando itens." action={<Button icon={Plus} onClick={() => navigate('/orcamentos/novo')}>Novo orçamento</Button>} />
        ) : filtered.length === 0 ? (
          <EmptyState icon={Search} title="Nenhum orçamento encontrado" description="Ajuste a busca ou o filtro de status." />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr><th>Número</th><th>Cliente / obra</th><th>Criado em</th><th className="num">Itens</th><th className="num">Total</th><th>Status</th><th /></tr>
              </thead>
              <tbody>
                {filtered.map((q) => (
                  <tr key={q.id}>
                    <td><Link to={`/orcamentos/${q.id}`} className="cell-main">{q.number}</Link> <DemoTag show={q.isDemo} /></td>
                    <td>
                      <div>{clientMap.get(q.clientId)?.name ?? '—'}</div>
                      <div className="cell-sub">{q.projectId ? projectMap.get(q.projectId)?.name : 'Sem obra vinculada'}</div>
                    </td>
                    <td>{formatDate(q.createdAt.slice(0, 10))}</td>
                    <td className="num">{q.items.length}</td>
                    <td className="num">{formatCurrency(quoteTotals(q).total)}</td>
                    <td><QuoteStatusBadge status={q.status} /></td>
                    <td className="actions">
                      <IconButton icon={Eye} label={`Visualizar ${q.number}`} onClick={() => navigate(`/orcamentos/${q.id}/visualizar`)} />
                      <IconButton icon={Pencil} label={`Editar ${q.number}`} onClick={() => navigate(`/orcamentos/${q.id}`)} />
                      {q.status === 'rascunho' && <IconButton icon={Trash2} label={`Excluir ${q.number}`} danger onClick={() => setDeleting(q)} />}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(undefined)}
        title="Excluir rascunho"
        message={<>Excluir o rascunho <strong>{deleting?.number}</strong>? Esta ação não pode ser desfeita.</>}
        confirmLabel="Excluir"
        onConfirm={async () => {
          await removeQuote(deleting!.id);
          toast.success('Rascunho excluído.');
        }}
      />
    </div>
  );
}
