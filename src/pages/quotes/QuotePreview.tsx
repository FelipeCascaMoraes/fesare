import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, FileText, Pencil, Printer } from 'lucide-react';
import { byId, useData } from '@/data/DataContext';
import { Banner, Button, EmptyState } from '@/components/ui';
import { BrandLogo } from '@/brand/BrandLogo';
import { PRODUCT_TYPE_LABELS, QUOTE_STATUS_LABELS } from '@/domain/labels';
import { formatCurrency, formatDate } from '@/domain/dates';
import { itemTotal, quoteTotals } from '@/domain/quote';

export function QuotePreview() {
  const { id } = useParams();
  const { quotes, clients, projects, settings } = useData();
  const quote = quotes.find((q) => q.id === id);

  if (!quote) {
    return (
      <div className="page">
        <div className="card">
          <EmptyState icon={FileText} title="Orçamento não encontrado" action={<Link className="btn btn-secondary" to="/orcamentos">Voltar</Link>} />
        </div>
      </div>
    );
  }

  const client = byId(clients).get(quote.clientId);
  const project = quote.projectId ? byId(projects).get(quote.projectId) : undefined;
  const totals = quoteTotals(quote);
  const companyContact = [settings.document, settings.phone, settings.email].filter(Boolean).join(' · ');

  return (
    <div className="page">
      <div className="row between wrap no-print mb-3">
        <Link to={`/orcamentos/${quote.id}`} className="btn btn-ghost btn-sm"><ArrowLeft />Voltar ao orçamento</Link>
        <div className="row">
          <Link to={`/orcamentos/${quote.id}`} className="btn btn-secondary"><Pencil />Editar</Link>
          <Button variant="secondary" icon={Printer} onClick={() => window.print()}>Imprimir pré-visualização</Button>
        </div>
      </div>

      <div className="no-print">
        <Banner tone="info" title="Pré-visualização.">
          Este é o layout do documento. A geração do documento oficial (PDF) será implementada junto com o motor de cálculo.
        </Banner>
      </div>

      <article className="doc">
        {(quote.isDemo || quote.status === 'rascunho') && (
          <div className="doc-watermark">
            {quote.isDemo ? 'Documento demonstrativo — valores fictícios' : 'Rascunho — pré-visualização'}
          </div>
        )}
        <header className="doc-head">
          <div className="doc-brand">
            <BrandLogo hideIfMissing />
            <div>
              <div className="doc-company">{settings.companyName}</div>
              <div className="small muted">{companyContact || 'Complete os dados da empresa em Configurações'}</div>
              {settings.address && <div className="small muted">{settings.address}</div>}
            </div>
          </div>
          <div className="doc-number">
            <h1>Orçamento</h1>
            <div className="cell-main">{quote.number}</div>
            <div className="small muted">{QUOTE_STATUS_LABELS[quote.status]}</div>
          </div>
        </header>

        <div className="doc-meta">
          <div>
            <div className="doc-label">Cliente</div>
            <div className="cell-main">{client?.name ?? '—'}</div>
            <div className="small muted">{[client?.document, client?.phone, client?.email].filter(Boolean).join(' · ')}</div>
          </div>
          <div>
            <div className="doc-label">Obra</div>
            <div className="cell-main">{project?.name ?? '—'}</div>
            <div className="small muted">{project?.address}</div>
          </div>
          <div>
            <div className="doc-label">Emissão</div>
            <div>{formatDate(quote.updatedAt.slice(0, 10))}</div>
          </div>
          <div>
            <div className="doc-label">Validade</div>
            <div>{formatDate(quote.validUntil)}</div>
          </div>
        </div>

        <div className="table-wrap">
          <table className="table doc-table">
            <thead>
              <tr><th>#</th><th>Descrição</th><th>Medidas (mm)</th><th className="num">Qtd.</th><th className="num">Unitário</th><th className="num">Total</th></tr>
            </thead>
            <tbody>
              {quote.items.length === 0 && <tr><td colSpan={6} className="muted doc-empty">Nenhum item.</td></tr>}
              {quote.items.map((i, idx) => (
                <tr key={i.id}>
                  <td>{idx + 1}</td>
                  <td>
                    <div className="cell-main">{i.model}</div>
                    <div className="cell-sub">{PRODUCT_TYPE_LABELS[i.productType]}{i.color ? ` · ${i.color}` : ''}{i.notes ? ` · ${i.notes}` : ''}</div>
                  </td>
                  <td>{i.widthMm} × {i.heightMm}</td>
                  <td className="num">{i.quantity}</td>
                  <td className="num">{formatCurrency(i.unitPrice)}</td>
                  <td className="num">{formatCurrency(itemTotal(i))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="doc-totals">
          <div>
            <div className="summary-row"><span>Subtotal</span><span>{formatCurrency(totals.subtotal)}</span></div>
            <div className="summary-row">
              <span>Desconto{quote.discountType === 'percent' && quote.discountValue > 0 ? ` (${quote.discountValue}%)` : ''}</span>
              <span>− {formatCurrency(totals.discount)}</span>
            </div>
            <div className="summary-row total"><span>Total</span><span>{formatCurrency(totals.total)}</span></div>
          </div>
        </div>

        {quote.notes && (
          <div className="mt-6">
            <div className="doc-label">Observações</div>
            <p className="pre-wrap">{quote.notes}</p>
          </div>
        )}
      </article>
    </div>
  );
}
