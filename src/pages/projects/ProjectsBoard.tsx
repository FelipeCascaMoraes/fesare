import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, HardHat, Plus, Search, User, UserCog } from 'lucide-react';
import { byId, useData } from '@/data/DataContext';
import { Avatar, Button, DemoTag, EmptyState, PageHeader } from '@/components/ui';
import { STAGE_COLORS } from '@/components/statusBadges';
import { useToast } from '@/components/Toast';
import { STAGE_LABELS } from '@/domain/labels';
import { PROJECT_STAGES, type Project, type ProjectStage } from '@/domain/types';
import { formatDate, todayISO } from '@/domain/dates';
import { ProjectForm } from './ProjectForm';

export function ProjectsBoard() {
  const { projects, clients, team, moveProject } = useData();
  const toast = useToast();
  const [query, setQuery] = useState('');
  const [responsible, setResponsible] = useState('');
  const [newIn, setNewIn] = useState<ProjectStage | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overStage, setOverStage] = useState<ProjectStage | null>(null);

  const clientMap = byId(clients);
  const teamMap = byId(team);
  const today = todayISO();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return projects.filter(
      (p) =>
        (!responsible || p.responsibleId === responsible) &&
        (!q || p.name.toLowerCase().includes(q) || clientMap.get(p.clientId)?.name.toLowerCase().includes(q)),
    );
  }, [projects, query, responsible, clientMap]);

  const move = async (p: Project, stage: ProjectStage) => {
    if (p.stage === stage) return;
    try {
      await moveProject(p.id, stage);
      toast.success(`"${p.name}" movida para ${STAGE_LABELS[stage]}.`);
    } catch (e) {
      toast.error(e);
    }
  };

  const onDrop = (stage: ProjectStage) => {
    const p = projects.find((x) => x.id === dragId);
    setDragId(null);
    setOverStage(null);
    if (p) move(p, stage);
  };

  return (
    <div className="page page-wide">
      <PageHeader
        title="Obras"
        subtitle="Acompanhe cada obra da proposta à instalação. Arraste os cartões ou use o seletor de etapa."
        actions={<Button icon={Plus} onClick={() => setNewIn('novo_orcamento')}>Nova obra</Button>}
      />

      <div className="toolbar">
        <div className="search">
          <Search />
          <input className="input" placeholder="Buscar obra ou cliente" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Buscar obras" />
        </div>
        <select className="select" value={responsible} onChange={(e) => setResponsible(e.target.value)} aria-label="Filtrar por responsável">
          <option value="">Todos os responsáveis</option>
          {team.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
      </div>

      {projects.length === 0 ? (
        <div className="card">
          <EmptyState icon={HardHat} title="Nenhuma obra cadastrada" description="Crie a primeira obra para acompanhá-la no quadro." action={<Button icon={Plus} onClick={() => setNewIn('novo_orcamento')}>Nova obra</Button>} />
        </div>
      ) : (
        <div className="kanban" role="list" aria-label="Quadro de obras">
          {PROJECT_STAGES.map((stage) => {
            const cards = filtered.filter((p) => p.stage === stage);
            return (
              <section
                key={stage}
                className={`k-col ${overStage === stage ? 'drop' : ''}`}
                aria-label={STAGE_LABELS[stage]}
                onDragOver={(e) => { e.preventDefault(); setOverStage(stage); }}
                onDragLeave={() => setOverStage((s) => (s === stage ? null : s))}
                onDrop={() => onDrop(stage)}
              >
                <div className="k-col-head">
                  <span className="k-col-title"><span className="dot" style={{ background: STAGE_COLORS[stage] }} />{STAGE_LABELS[stage]}</span>
                  <span className="k-count">{cards.length}</span>
                </div>
                {cards.length === 0 && <div className="k-empty">Nenhuma obra</div>}
                {cards.map((p) => {
                  const resp = p.responsibleId ? teamMap.get(p.responsibleId) : undefined;
                  const late = p.deadline && p.deadline < today && p.stage !== 'concluido';
                  return (
                    <article
                      key={p.id}
                      className={`k-card ${dragId === p.id ? 'dragging' : ''}`}
                      draggable
                      onDragStart={(e) => { setDragId(p.id); e.dataTransfer.effectAllowed = 'move'; }}
                      onDragEnd={() => { setDragId(null); setOverStage(null); }}
                      role="listitem"
                    >
                      <div className="k-card-head">
                        <Link to={`/obras/${p.id}`} className="k-card-title">{p.name}</Link>
                        <DemoTag show={p.isDemo} />
                      </div>
                      <div className="k-meta">
                        <span><User />{clientMap.get(p.clientId)?.name ?? 'Cliente removido'}</span>
                        <span className={late ? 'overdue' : ''}><CalendarDays />Prazo: {formatDate(p.deadline)}{late ? ' · atrasada' : ''}</span>
                        <span><UserCog />{resp?.name ?? 'Sem responsável'}</span>
                      </div>
                      <div className="k-foot">
                        <Avatar small name={resp?.name ?? 'Sem responsável'} />
                        <select
                          className="select"
                          value={p.stage}
                          aria-label={`Alterar etapa de ${p.name}`}
                          onChange={(e) => move(p, e.target.value as ProjectStage)}
                        >
                          {PROJECT_STAGES.map((s) => <option key={s} value={s}>{STAGE_LABELS[s]}</option>)}
                        </select>
                      </div>
                    </article>
                  );
                })}
              </section>
            );
          })}
        </div>
      )}

      {newIn && <ProjectForm initialStage={newIn} onClose={() => setNewIn(null)} />}
    </div>
  );
}
