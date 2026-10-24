import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Eye, FileText, Pencil, Plus, Save, Send, Trash2 } from 'lucide-react';
import { useData } from '@/data/DataContext';
import { Banner, Button, Card, DemoTag, EmptyState, IconButton, PageHeader } from '@/components/ui';
import { SelectField, TextAreaField, TextField } from '@/components/forms';
import { QuoteStatusBadge } from '@/components/statusBadges';
import { useToast } from '@/components/Toast';
import { ClientForm } from '@/pages/Clients';
import { fieldErrors, quoteHeaderSchema } from '@/domain/schemas';
import { PRODUCT_TYPE_LABELS, QUOTE_STATUS_LABELS } from '@/domain/labels';
import { QUOTE_STATUSES, type DiscountType, type Quote, type QuoteItem, type QuoteStatus } from '@/domain/types';
import { addDays, formatCurrency, todayISO } from '@/domain/dates';
import { computeTotals, itemAreaM2, itemTotal } from '@/domain/quote';
import { QuoteItemForm } from './QuoteItemForm';

interface Draft {
  clientId: string;
  projectId: string;
  status: QuoteStatus;
  discountType: DiscountType;
  discountValue: string;
  validUntil: string;
  notes: string;
  items: QuoteItem[];
}

function toDraft(q: Quote): Draft {
  return {
    clientId: q.clientId,
    projectId: q.projectId ?? '',
    status: q.status,
    discountType: q.discountType,
    discountValue: String(q.discountValue),
    validUntil: q.validUntil ?? '',
    notes: q.notes ?? '',
    items: q.items,
  };
}

export function QuoteEditor() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { quotes, clients, projects, settings, saveQuote } = useData();

  const existing = id ? quotes.find((q) => q.id === id) : undefined;
  const presetProject = projects.find((p) => p.id === params.get('obra'));

  const [draft, setDraft] = useState<Draft>(() =>
    existing
      ? toDraft(existing)
      : {
          clientId: presetProject?.clientId ?? '',
          projectId: presetProject?.id ?? '',
          status: 'rascunho',
          discountType: 'percent',
          discountValue: '0',
          validUntil: addDays(todayISO(), settings.quoteValidityDays),
          notes: '',
          items: [],
        },
  );
  const [dirty, setDirty] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [itemForm, setItemForm] = useState<QuoteItem | null | undefined>(undefined);
  const [clientFormOpen, setClientFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const update = (patch: Partial<Draft>) => {
    setDraft((d) => ({ ...d, ...patch }));
    setDirty(true);
    setErrors((e) => { const n = { ...e }; Object.keys(patch).forEach((k) => delete n[k]); return n; });
  };

  const clientProjects = projects.filter((p) => p.clientId === draft.clientId);
  const totals = useMemo(
    () => computeTotals(draft.items, draft.discountType, Number(draft.discountValue) || 0),
    [draft.items, draft.discountType, draft.discountValue],
  );

  if (id && !existing) {
    return (
      <div className="page">
        <div className="card">
          <EmptyState icon={FileText} title="Orçamento não encontrado" description="Ele pode ter sido excluído." action={<Link className="btn btn-secondary" to="/orcamentos">Voltar para Orçamentos</Link>} />
        </div>
      </div>
    );
  }

  const save = async (status: QuoteStatus = draft.status) => {
    const result = quoteHeaderSchema.safeParse(draft);
    const errs = result.success ? {} : fieldErrors(result.error);
    if (status !== 'rascunho' && draft.items.length === 0) errs.items = 'Adicione pelo menos um item antes de enviar para aprovação.';
    if (draft.discountType === 'percent' && Number(draft.discountValue) > 100) errs.discountValue = 'O desconto percentual não pode passar de 100%.';
    if (Object.keys(errs).length || !result.success) {
      setErrors(errs);
      toast.error('Revise os campos destacados.');
      return;
    }
    setSaving(true);
    try {
      const saved = await saveQuote(
        { ...result.data, status, items: draft.items, isDemo: existing?.isDemo },
        existing?.id,
      );
      setDraft((d) => ({ ...d, status }));
      setDirty(false);
      toast.success(status === 'aguardando_aprovacao' && existing?.status !== status ? `Orçamento ${saved.number} enviado para aprovação.` : `Orçamento ${saved.number} salvo.`);
      if (!existing) navigate(`/orcamentos/${saved.id}`, { replace: true });
    } catch (e) {
      toast.error(e);
    } finally {
      setSaving(false);
    }
  };

  const upsertItem = (item: QuoteItem) => {
    const exists = draft.items.some((i) => i.id === item.id);
    update({ items: exists ? draft.items.map((i) => (i.id === item.id ? item : i)) : [...draft.items, item] });
  };

  return (
    <div className="page">
      <Link to="/orcamentos" className="btn btn-ghost btn-sm back-link"><ArrowLeft />Orçamentos</Link>
      <PageHeader
        title={existing ? existing.number : 'Novo orçamento'}
        subtitle={
          <span className="row">
            <QuoteStatusBadge status={draft.status} />
            <DemoTag show={!!existing?.isDemo} />
            {dirty && <span className="small text-warning">Alterações não salvas</span>}
          </span>
        }
        actions={
          <>
            {existing && (
              <Button variant="secondary" icon={Eye} disabled={dirty} title={dirty ? 'Salve as alterações antes de visualizar' : undefined} onClick={() => navigate(`/orcamentos/${existing.id}/visualizar`)}>
                Visualizar
              </Button>
            )}
            <Button variant="secondary" icon={Save} loading={saving} onClick={() => save(existing ? draft.status : 'rascunho')}>
              {existing && draft.status !== 'rascunho' ? 'Salvar' : 'Salvar rascunho'}
            </Button>
            {draft.status === 'rascunho' && (
              <Button icon={Send} loading={saving} onClick={() => save('aguardando_aprovacao')}>Enviar para aprovação</Button>
            )}
          </>
        }
      />

      <Banner tone="warning" title="Motor de cálculo não integrado.">
        Os valores unitários são digitados manualmente e nenhum preço é calculado automaticamente. Valores em registros
        marcados como <DemoTag /> são fictícios.
      </Banner>

      <div className="quote-layout">
        <div className="stack">
          <Card title="Cliente e obra">
            <div className="form-grid">
              <SelectField
                label="Cliente"
                required
                value={draft.clientId}
                error={errors.clientId}
                onChange={(e) => update({ clientId: e.target.value, projectId: '' })}
              >
                <option value="">Selecione…</option>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </SelectField>
              <SelectField
                label="Obra"
                value={draft.projectId}
                onChange={(e) => update({ projectId: e.target.value })}
                disabled={!draft.clientId}
                hint={!draft.clientId ? 'Selecione o cliente primeiro' : clientProjects.length === 0 ? 'Este cliente ainda não tem obras' : undefined}
              >
                <option value="">Sem obra vinculada</option>
                {clientProjects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </SelectField>
              <TextField label="Válido até" type="date" value={draft.validUntil} error={errors.validUntil} onChange={(e) => update({ validUntil: e.target.value })} />
              {existing ? (
                <SelectField label="Status" value={draft.status} onChange={(e) => update({ status: e.target.value as QuoteStatus })}>
                  {QUOTE_STATUSES.map((s) => <option key={s} value={s}>{QUOTE_STATUS_LABELS[s]}</option>)}
                </SelectField>
              ) : (
                <div className="field end">
                  <Button variant="ghost" size="sm" icon={Plus} onClick={() => setClientFormOpen(true)}>Cadastrar novo cliente</Button>
                </div>
              )}
            </div>
          </Card>

          <Card
            title="Itens"
            subtitle={draft.items.length ? `${draft.items.length} item(ns)` : undefined}
            actions={<Button size="sm" icon={Plus} onClick={() => setItemForm(null)}>Adicionar item</Button>}
          >
            {errors.items && <p className="field-error mb-3" role="alert">{errors.items}</p>}
            {draft.items.length === 0 ? (
              <EmptyState icon={FileText} title="Nenhum item adicionado" description="Adicione esquadrias, portas ou portões com suas medidas." action={<Button variant="secondary" icon={Plus} onClick={() => setItemForm(null)}>Adicionar item</Button>} />
            ) : (
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr><th>Item</th><th>Medidas (mm)</th><th className="num">Qtd.</th><th className="num">Unitário</th><th className="num">Total</th><th /></tr>
                  </thead>
                  <tbody>
                    {draft.items.map((i) => (
                      <tr key={i.id}>
                        <td>
                          <div className="cell-main">{i.model}</div>
                          <div className="cell-sub">{PRODUCT_TYPE_LABELS[i.productType]}{i.color ? ` · ${i.color}` : ''}{i.notes ? ` · ${i.notes}` : ''}</div>
                        </td>
                        <td>{i.widthMm} × {i.heightMm}<div className="cell-sub">{itemAreaM2(i).toLocaleString('pt-BR')} m²</div></td>
                        <td className="num">{i.quantity}</td>
                        <td className="num">{formatCurrency(i.unitPrice)}</td>
                        <td className="num">{formatCurrency(itemTotal(i))}</td>
                        <td className="actions">
                          <IconButton icon={Pencil} label={`Editar ${i.model}`} onClick={() => setItemForm(i)} />
                          <IconButton icon={Trash2} label={`Remover ${i.model}`} danger onClick={() => update({ items: draft.items.filter((x) => x.id !== i.id) })} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          <Card title="Observações">
            <TextAreaField label="Observações do orçamento" value={draft.notes} error={errors.notes} onChange={(e) => update({ notes: e.target.value })} placeholder="Condições, prazos de entrega, informações para o cliente…" />
          </Card>
        </div>

        <Card title="Resumo" className="summary">
          <div className="summary-row"><span>Subtotal</span><span>{formatCurrency(totals.subtotal)}</span></div>
          <div className="form-grid summary-grid">
            <SelectField label="Desconto" value={draft.discountType} onChange={(e) => update({ discountType: e.target.value as DiscountType })}>
              <option value="percent">Percentual</option>
              <option value="value">Valor</option>
            </SelectField>
            <TextField label={draft.discountType === 'percent' ? '%' : 'R$'} type="number" min={0} step="0.01" value={draft.discountValue} error={errors.discountValue} onChange={(e) => update({ discountValue: e.target.value })} />
          </div>
          <div className="summary-row"><span>Desconto</span><span>− {formatCurrency(totals.discount)}</span></div>
          <div className="summary-row total"><span>Total</span><span>{formatCurrency(totals.total)}</span></div>
          <p className="small muted mt-3">Totais calculados apenas a partir dos valores informados manualmente.</p>
        </Card>
      </div>

      {itemForm !== undefined && <QuoteItemForm item={itemForm ?? undefined} onClose={() => setItemForm(undefined)} onSubmit={upsertItem} />}
      {clientFormOpen && <ClientForm onClose={() => setClientFormOpen(false)} onSaved={(c) => update({ clientId: c.id, projectId: '' })} />}
    </div>
  );
}
