import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ListChecks, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { byId, useData } from '@/data/DataContext';
import { Avatar, Button, Card, DemoTag, EmptyState, IconButton, PageHeader } from '@/components/ui';
import { ConfirmDialog, Modal } from '@/components/Modal';
import { SelectField, TextAreaField, TextField, toFormValues, useForm } from '@/components/forms';
import { PriorityLabel } from '@/components/statusBadges';
import { useToast } from '@/components/Toast';
import { taskSchema } from '@/domain/schemas';
import { PRIORITY_LABELS, TASK_STATUS_LABELS } from '@/domain/labels';
import { TASK_PRIORITIES, TASK_STATUSES, type Task, type TaskStatus } from '@/domain/types';
import { formatDate, todayISO } from '@/domain/dates';

const prioOrder = { alta: 0, media: 1, baixa: 2 };
const blank = { title: '', description: '', dueDate: '', priority: 'media', status: 'pendente', responsibleId: '', projectId: '' };

function TaskForm({ task, onClose }: { task?: Task; onClose: () => void }) {
  const { team, projects, saveTask } = useData();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const form = useForm(taskSchema, toFormValues(blank, task));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = form.validate();
    if (!data) return;
    setBusy(true);
    try {
      await saveTask({ ...data, isDemo: task?.isDemo }, task?.id);
      toast.success(task ? 'Tarefa atualizada.' : 'Tarefa criada.');
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
      title={task ? 'Editar tarefa' : 'Nova tarefa'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button type="submit" form="task-form" loading={busy}>Salvar tarefa</Button>
        </>
      }
    >
      <form id="task-form" className="form-grid" onSubmit={submit} noValidate>
        <TextField label="Título" required className="span-2" {...form.bind('title')} />
        <TextField label="Prazo" type="date" {...form.bind('dueDate')} />
        <SelectField label="Prioridade" {...form.bind('priority')}>
          {TASK_PRIORITIES.map((p) => <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>)}
        </SelectField>
        <SelectField label="Responsável" {...form.bind('responsibleId')}>
          <option value="">Sem responsável</option>
          {team.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
        </SelectField>
        <SelectField label="Status" {...form.bind('status')}>
          {TASK_STATUSES.map((s) => <option key={s} value={s}>{TASK_STATUS_LABELS[s]}</option>)}
        </SelectField>
        <SelectField label="Obra vinculada" className="span-2" {...form.bind('projectId')}>
          <option value="">Nenhuma</option>
          {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </SelectField>
        <TextAreaField label="Descrição" className="span-2" {...form.bind('description')} />
      </form>
    </Modal>
  );
}

export function Tasks() {
  const { tasks, team, projects, setTaskStatus, removeTask } = useData();
  const toast = useToast();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<TaskStatus | 'abertas' | ''>('abertas');
  const [responsible, setResponsible] = useState('');
  const [formTask, setFormTask] = useState<Task | null | undefined>(undefined); // undefined = fechado, null = nova
  const [deleting, setDeleting] = useState<Task>();

  const teamMap = byId(team);
  const projectMap = byId(projects);
  const today = todayISO();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tasks
      .filter((t) => (status === 'abertas' ? t.status !== 'concluida' : !status || t.status === status))
      .filter((t) => !responsible || t.responsibleId === responsible)
      .filter((t) => !q || t.title.toLowerCase().includes(q))
      .sort((a, b) => (a.dueDate ?? '9999').localeCompare(b.dueDate ?? '9999') || prioOrder[a.priority] - prioOrder[b.priority]);
  }, [tasks, query, status, responsible]);

  const changeStatus = async (t: Task, s: TaskStatus) => {
    try {
      await setTaskStatus(t.id, s);
    } catch (e) {
      toast.error(e);
    }
  };

  const counts = {
    abertas: tasks.filter((t) => t.status !== 'concluida').length,
    ...Object.fromEntries(TASK_STATUSES.map((s) => [s, tasks.filter((t) => t.status === s).length])),
  } as Record<string, number>;

  return (
    <div className="page">
      <PageHeader
        title="Tarefas"
        subtitle="Prazos, prioridades e responsáveis das atividades da equipe."
        actions={<Button icon={Plus} onClick={() => setFormTask(null)}>Nova tarefa</Button>}
      />

      <div className="toolbar">
        <div className="chips" role="group" aria-label="Filtrar por status">
          {(['abertas', ...TASK_STATUSES, ''] as const).map((s) => (
            <button key={s || 'todas'} type="button" className={`chip ${status === s ? 'active' : ''}`} onClick={() => setStatus(s)} aria-pressed={status === s}>
              {s === 'abertas' ? 'Em aberto' : s === '' ? 'Todas' : TASK_STATUS_LABELS[s]}
              <span className="count">{s === '' ? tasks.length : counts[s]}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="toolbar">
        <div className="search">
          <Search />
          <input className="input" placeholder="Buscar tarefa" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Buscar tarefas" />
        </div>
        <select className="select" value={responsible} onChange={(e) => setResponsible(e.target.value)} aria-label="Filtrar por responsável">
          <option value="">Todos os responsáveis</option>
          {team.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
      </div>

      <Card>
        {tasks.length === 0 ? (
          <EmptyState icon={ListChecks} title="Nenhuma tarefa" description="Crie tarefas para organizar medições, compras, produção e instalações." action={<Button icon={Plus} onClick={() => setFormTask(null)}>Nova tarefa</Button>} />
        ) : filtered.length === 0 ? (
          <EmptyState icon={Search} title="Nenhuma tarefa encontrada" description="Ajuste os filtros para ver outras tarefas." />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr><th style={{ width: 36 }} /><th>Tarefa</th><th>Prazo</th><th>Prioridade</th><th>Responsável</th><th>Status</th><th /></tr>
              </thead>
              <tbody>
                {filtered.map((t) => {
                  const resp = t.responsibleId ? teamMap.get(t.responsibleId) : undefined;
                  const project = t.projectId ? projectMap.get(t.projectId) : undefined;
                  const late = t.dueDate && t.dueDate < today && t.status !== 'concluida';
                  return (
                    <tr key={t.id}>
                      <td>
                        <input
                          type="checkbox"
                          checked={t.status === 'concluida'}
                          onChange={(e) => changeStatus(t, e.target.checked ? 'concluida' : 'pendente')}
                          aria-label={`Marcar "${t.title}" como concluída`}
                        />
                      </td>
                      <td className="wide">
                        <div className={`cell-main ${t.status === 'concluida' ? 'cell-done' : ''}`}>
                          {t.title} <DemoTag show={t.isDemo} />
                        </div>
                        {project && <Link to={`/obras/${project.id}`} className="cell-sub">{project.name}</Link>}
                      </td>
                      <td className={late ? 'overdue' : ''}>{formatDate(t.dueDate)}{late && ' · atrasada'}</td>
                      <td><PriorityLabel priority={t.priority} /></td>
                      <td>{resp ? <span className="row"><Avatar small name={resp.name} />{resp.name}</span> : <span className="muted">—</span>}</td>
                      <td>
                        <select className="select select-sm" value={t.status} onChange={(e) => changeStatus(t, e.target.value as TaskStatus)} aria-label={`Status de ${t.title}`}>
                          {TASK_STATUSES.map((s) => <option key={s} value={s}>{TASK_STATUS_LABELS[s]}</option>)}
                        </select>
                      </td>
                      <td className="actions">
                        <IconButton icon={Pencil} label={`Editar ${t.title}`} onClick={() => setFormTask(t)} />
                        <IconButton icon={Trash2} label={`Excluir ${t.title}`} danger onClick={() => setDeleting(t)} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {formTask !== undefined && <TaskForm task={formTask ?? undefined} onClose={() => setFormTask(undefined)} />}
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(undefined)}
        title="Excluir tarefa"
        message={<>Excluir a tarefa <strong>{deleting?.title}</strong>?</>}
        confirmLabel="Excluir"
        onConfirm={async () => {
          await removeTask(deleting!.id);
          toast.success('Tarefa excluída.');
        }}
      />
    </div>
  );
}
