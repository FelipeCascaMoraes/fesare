import { BarChart3 } from 'lucide-react';
import { byId, useData } from '@/data/DataContext';
import { Banner, Card, EmptyState, PageHeader } from '@/components/ui';
import { QUOTE_STATUS_LABELS, STAGE_LABELS } from '@/domain/labels';
import { PROJECT_STAGES, QUOTE_STATUSES } from '@/domain/types';
import { formatCurrency } from '@/domain/dates';
import { quoteTotals } from '@/domain/quote';

/** Relatórios básicos calculados a partir dos dados existentes (sem armazenamento próprio). */
export function Reports() {
  const { quotes, projects, tasks, team, clients } = useData();
  const teamMap = byId(team);
  const hasDemo = [quotes, projects, tasks].some((l) => l.some((x) => x.isDemo));

  const quoteRows = QUOTE_STATUSES.map((s) => {
    const list = quotes.filter((q) => q.status === s);
    return { label: QUOTE_STATUS_LABELS[s], count: list.length, total: list.reduce((sum, q) => sum + quoteTotals(q).total, 0) };
  });
  const decided = quotes.filter((q) => q.status === 'aprovado' || q.status === 'recusado').length;
  const approvalRate = decided ? Math.round((quotes.filter((q) => q.status === 'aprovado').length / decided) * 100) : null;

  const workload = team.map((m) => ({
    name: m.name,
    role: m.role,
    projects: projects.filter((p) => p.responsibleId === m.id && p.stage !== 'concluido').length,
    tasks: tasks.filter((t) => t.responsibleId === m.id && t.status !== 'concluida').length,
  }));
  const unassigned = tasks.filter((t) => !t.responsibleId || !teamMap.has(t.responsibleId)).length;

  return (
    <div className="page">
      <PageHeader title="Relatórios" subtitle="Indicadores consolidados. Relatórios financeiros detalhados virão com o motor de cálculo." />
      {hasDemo && <Banner tone="demo" title="Inclui dados demonstrativos.">Os números consideram registros fictícios até que sejam removidos em Configurações.</Banner>}

      {quotes.length + projects.length + tasks.length === 0 ? (
        <div className="card"><EmptyState icon={BarChart3} title="Sem dados para relatórios" description="Os relatórios serão gerados conforme orçamentos, obras e tarefas forem cadastrados." /></div>
      ) : (
        <div className="stack">
          <div className="grid grid-2">
            <Card title="Orçamentos por status" subtitle={approvalRate === null ? 'Taxa de aprovação: sem orçamentos decididos' : `Taxa de aprovação: ${approvalRate}%`}>
              <table className="table">
                <thead><tr><th>Status</th><th className="num">Qtd.</th><th className="num">Valor (manual)</th></tr></thead>
                <tbody>
                  {quoteRows.map((r) => <tr key={r.label}><td>{r.label}</td><td className="num">{r.count}</td><td className="num">{formatCurrency(r.total)}</td></tr>)}
                </tbody>
              </table>
            </Card>
            <Card title="Obras por etapa" subtitle={`${clients.length} clientes · ${projects.length} obras`}>
              <table className="table">
                <thead><tr><th>Etapa</th><th className="num">Obras</th></tr></thead>
                <tbody>
                  {PROJECT_STAGES.map((s) => <tr key={s}><td>{STAGE_LABELS[s]}</td><td className="num">{projects.filter((p) => p.stage === s).length}</td></tr>)}
                </tbody>
              </table>
            </Card>
          </div>
          <Card title="Carga de trabalho da equipe" subtitle={unassigned ? `${unassigned} tarefa(s) sem responsável` : undefined}>
            {workload.length === 0 ? (
              <EmptyState icon={BarChart3} title="Nenhum membro de equipe cadastrado" />
            ) : (
              <table className="table">
                <thead><tr><th>Responsável</th><th>Função</th><th className="num">Obras ativas</th><th className="num">Tarefas abertas</th></tr></thead>
                <tbody>
                  {workload.map((w) => <tr key={w.name}><td className="cell-main">{w.name}</td><td>{w.role}</td><td className="num">{w.projects}</td><td className="num">{w.tasks}</td></tr>)}
                </tbody>
              </table>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
