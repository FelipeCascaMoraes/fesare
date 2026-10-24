import { Link } from 'react-router-dom';
import {
  BookOpen,
  CalendarClock,
  ClipboardList,
  FileClock,
  FileText,
  HardHat,
  ListChecks,
  Settings2,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { byId, useData } from '@/data/DataContext';
import { Banner, Card, DemoTag, EmptyState, PageHeader } from '@/components/ui';
import { STAGE_LABELS } from '@/domain/labels';
import { PROJECT_STAGES, type ActivityKind } from '@/domain/types';
import { addDays, formatDate, relativeTime, todayISO } from '@/domain/dates';

const ACTIVITY_ICONS: Record<ActivityKind, LucideIcon> = {
  quote: FileText,
  project: HardHat,
  task: ListChecks,
  client: Users,
  catalog: BookOpen,
  system: Settings2,
};

function StatCard({ icon: Icon, label, value, to, accent }: { icon: LucideIcon; label: string; value: number; to: string; accent?: boolean }) {
  return (
    <Link to={to} className="card stat-card" aria-label={`${label}: ${value}`}>
      <div className="stat-top">
        <div className={`stat-icon ${accent ? 'accent' : ''}`}><Icon size={19} /></div>
      </div>
      <div>
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
      </div>
    </Link>
  );
}

export function Dashboard() {
  const { quotes, projects, tasks, activities, clients } = useData();
  const today = todayISO();
  const in14 = addDays(today, 14);
  const clientMap = byId(clients);

  const openQuotes = quotes.filter((q) => q.status === 'rascunho' || q.status === 'aguardando_aprovacao').length;
  const awaiting = quotes.filter((q) => q.status === 'aguardando_aprovacao').length;
  const inProgress = projects.filter((p) => ['aprovado', 'em_producao', 'pronto_instalacao', 'instalacao_agendada'].includes(p.stage)).length;
  const upcoming = projects
    .filter((p) => p.installationDate && p.installationDate >= today && p.installationDate <= in14)
    .sort((a, b) => a.installationDate!.localeCompare(b.installationDate!));
  const pendingTasks = tasks.filter((t) => t.status !== 'concluida').length;

  const hasDemo = [quotes, projects, tasks, activities].some((l) => l.some((x) => x.isDemo));
  const recent = [...activities].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 8);
  const totalProjects = Math.max(1, projects.length);

  return (
    <div className="page">
      <PageHeader
        title="Dashboard"
        subtitle="Visão geral dos orçamentos, obras e tarefas da Fesare."
      />

      {hasDemo && (
        <Banner tone="demo" title="Dados demonstrativos.">
          Os indicadores abaixo incluem registros fictícios (marcados com o selo <DemoTag />). Eles podem ser removidos em{' '}
          <Link to="/configuracoes" className="link">Configurações</Link>.
        </Banner>
      )}

      <div className="grid grid-stats">
        <StatCard icon={FileText} label="Orçamentos em aberto" value={openQuotes} to="/orcamentos" />
        <StatCard icon={FileClock} label="Aguardando aprovação" value={awaiting} to="/orcamentos?status=aguardando_aprovacao" accent />
        <StatCard icon={HardHat} label="Obras em andamento" value={inProgress} to="/obras" />
        <StatCard icon={CalendarClock} label="Instalações (próx. 14 dias)" value={upcoming.length} to="/calendario" accent />
        <StatCard icon={ClipboardList} label="Tarefas pendentes" value={pendingTasks} to="/tarefas" />
      </div>

      <div className="grid grid-2 mt-6">
        <Card title="Obras por etapa" subtitle={`${projects.length} obras cadastradas`} actions={<Link className="btn btn-ghost btn-sm" to="/obras">Abrir quadro</Link>}>
          {projects.length === 0 ? (
            <EmptyState icon={HardHat} title="Nenhuma obra cadastrada" description="As obras aparecerão aqui agrupadas por etapa." />
          ) : (
            <div className="stage-bars">
              {PROJECT_STAGES.map((s) => {
                const n = projects.filter((p) => p.stage === s).length;
                return (
                  <div key={s} className="stage-bar" title={`${STAGE_LABELS[s]}: ${n} obra(s)`}>
                    <span className="muted">{STAGE_LABELS[s]}</span>
                    <div className="track"><div className="fill" style={{ width: `${(n / totalProjects) * 100}%` }} /></div>
                    <span className="n">{n}</span>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <Card title="Atividades recentes">
          {recent.length === 0 ? (
            <EmptyState icon={ListChecks} title="Sem atividades ainda" description="Ações como criar orçamentos ou mover obras serão registradas aqui." />
          ) : (
            <ul className="activity">
              {recent.map((a) => {
                const Icon = ACTIVITY_ICONS[a.kind];
                return (
                  <li key={a.id}>
                    <span className="a-icon"><Icon /></span>
                    <div>
                      <div className="a-msg">{a.message} <DemoTag show={a.isDemo} /></div>
                      <div className="a-time">{relativeTime(a.createdAt)}</div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>

      <Card className="mt-6" title="Próximas instalações" subtitle="Próximos 14 dias">
        {upcoming.length === 0 ? (
          <EmptyState icon={CalendarClock} title="Nenhuma instalação agendada" description="Defina a data de instalação nas obras para acompanhá-las aqui." />
        ) : (
          <ul className="list-plain">
            {upcoming.map((p) => (
              <li key={p.id}>
                <div>
                  <Link to={`/obras/${p.id}`} className="cell-main">{p.name}</Link> <DemoTag show={p.isDemo} />
                  <div className="cell-sub">{clientMap.get(p.clientId)?.name}</div>
                </div>
                <span className="badge badge-accent">{formatDate(p.installationDate)}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
