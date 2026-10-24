import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, FileText, HardHat, ListChecks, Pencil, Plus, Trash2 } from 'lucide-react';
import { byId, useData } from '@/data/DataContext';
import { Button, Card, DemoTag, EmptyState, PageHeader } from '@/components/ui';
import { ConfirmDialog } from '@/components/Modal';
import { PriorityLabel, QuoteStatusBadge, StageBadge, TaskStatusBadge } from '@/components/statusBadges';
import { useToast } from '@/components/Toast';
import { STAGE_LABELS } from '@/domain/labels';
import { PROJECT_STAGES, type ProjectStage } from '@/domain/types';
import { formatCurrency, formatDate } from '@/domain/dates';
import { quoteTotals } from '@/domain/quote';
import { ProjectForm } from './ProjectForm';

export function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { projects, clients, team, quotes, tasks, moveProject, removeProject } = useData();
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const project = projects.find((p) => p.id === id);
  if (!project) {
    return (
      <div className="page">
        <div className="card">
          <EmptyState icon={HardHat} title="Obra não encontrada" description="Ela pode ter sido excluída." action={<Link className="btn btn-secondary" to="/obras">Voltar para Obras</Link>} />
        </div>
      </div>
    );
  }

  const client = byId(clients).get(project.clientId);
  const resp = project.responsibleId ? byId(team).get(project.responsibleId) : undefined;
  const projectQuotes = quotes.filter((q) => q.projectId === project.id);
  const projectTasks = tasks.filter((t) => t.projectId === project.id);
  const stageIndex = PROJECT_STAGES.indexOf(project.stage);

  const changeStage = async (stage: ProjectStage) => {
    try {
      await moveProject(project.id, stage);
      toast.success(`Etapa alterada para ${STAGE_LABELS[stage]}.`);
    } catch (e) {
      toast.error(e);
    }
  };

  return (
    <div className="page">
      <Link to="/obras" className="btn btn-ghost btn-sm back-link"><ArrowLeft />Obras</Link>
      <PageHeader
        title={project.name}
        subtitle={<span className="row"><StageBadge stage={project.stage} /> <DemoTag show={project.isDemo} /></span>}
        actions={
          <>
            <Button variant="secondary" icon={Pencil} onClick={() => setEditing(true)}>Editar</Button>
            <Button variant="secondary" icon={Trash2} onClick={() => setDeleting(true)}>Excluir</Button>
          </>
        }
      />

      <Card title="Progresso" className="mt-2">
        <div className="chips">
          {PROJECT_STAGES.map((s, i) => (
            <button
              key={s}
              type="button"
              className={`chip ${s === project.stage ? 'active' : i < stageIndex ? 'done' : ''}`}
              onClick={() => changeStage(s)}
              aria-pressed={s === project.stage}
            >
              {i + 1}. {STAGE_LABELS[s]}
            </button>
          ))}
        </div>
      </Card>

      <div className="grid grid-2 mt-6">
        <Card title="Detalhes da obra">
          <dl className="detail-list">
            <dt>Cliente</dt><dd>{client?.name ?? '—'}</dd>
            <dt>Endereço</dt><dd>{project.address || '—'}</dd>
            <dt>Responsável</dt><dd>{resp ? `${resp.name} (${resp.role})` : '—'}</dd>
            <dt>Prazo</dt><dd>{formatDate(project.deadline)}</dd>
            <dt>Instalação</dt><dd>{formatDate(project.installationDate)}</dd>
            <dt>Observações</dt><dd>{project.notes || '—'}</dd>
          </dl>
        </Card>

        <Card
          title="Orçamentos"
          actions={<Link className="btn btn-ghost btn-sm" to={`/orcamentos/novo?obra=${project.id}`}><Plus />Novo</Link>}
        >
          {projectQuotes.length === 0 ? (
            <EmptyState icon={FileText} title="Nenhum orçamento" description="Crie um orçamento vinculado a esta obra." />
          ) : (
            <ul className="list-plain">
              {projectQuotes.map((q) => (
                <li key={q.id}>
                  <div>
                    <Link to={`/orcamentos/${q.id}`} className="cell-main">{q.number}</Link>
                    <div className="cell-sub">{formatCurrency(quoteTotals(q).total)}</div>
                  </div>
                  <QuoteStatusBadge status={q.status} />
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card className="mt-6" title="Tarefas da obra" actions={<Link className="btn btn-ghost btn-sm" to="/tarefas">Ver todas</Link>}>
        {projectTasks.length === 0 ? (
          <EmptyState icon={ListChecks} title="Nenhuma tarefa vinculada" description="Crie tarefas no módulo Tarefas e vincule a esta obra." />
        ) : (
          <ul className="list-plain">
            {projectTasks.map((t) => (
              <li key={t.id}>
                <div>
                  <div className="cell-main">{t.title}</div>
                  <div className="cell-sub">Prazo: {formatDate(t.dueDate)}</div>
                </div>
                <div className="row"><PriorityLabel priority={t.priority} /><TaskStatusBadge status={t.status} /></div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {editing && <ProjectForm project={project} onClose={() => setEditing(false)} />}
      <ConfirmDialog
        open={deleting}
        onClose={() => setDeleting(false)}
        title="Excluir obra"
        message={<>Excluir <strong>{project.name}</strong>? As tarefas vinculadas serão mantidas, sem vínculo com a obra.</>}
        confirmLabel="Excluir obra"
        onConfirm={async () => {
          await removeProject(project.id);
          toast.success('Obra excluída.');
          navigate('/obras');
        }}
      />
    </div>
  );
}
