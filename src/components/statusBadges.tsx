import type { ProjectStage, QuoteStatus, TaskPriority, TaskStatus } from '@/domain/types';
import { PRIORITY_LABELS, QUOTE_STATUS_LABELS, STAGE_LABELS, TASK_STATUS_LABELS } from '@/domain/labels';
import { Badge, type Tone } from './ui';

const QUOTE_TONE: Record<QuoteStatus, Tone> = {
  rascunho: 'muted',
  aguardando_aprovacao: 'warning',
  aprovado: 'success',
  recusado: 'danger',
};

export const STAGE_COLORS: Record<ProjectStage, string> = {
  novo_orcamento: 'var(--stage-1)',
  aguardando_aprovacao: 'var(--stage-2)',
  aprovado: 'var(--stage-3)',
  em_producao: 'var(--stage-4)',
  pronto_instalacao: 'var(--stage-5)',
  instalacao_agendada: 'var(--stage-6)',
  concluido: 'var(--stage-7)',
};

const TASK_TONE: Record<TaskStatus, Tone> = { pendente: 'warning', em_andamento: 'info', concluida: 'success' };

export const QuoteStatusBadge = ({ status }: { status: QuoteStatus }) => (
  <Badge tone={QUOTE_TONE[status]} dot>{QUOTE_STATUS_LABELS[status]}</Badge>
);

export const StageBadge = ({ stage }: { stage: ProjectStage }) => (
  <Badge tone={stage === 'concluido' ? 'success' : stage === 'instalacao_agendada' ? 'accent' : 'default'} dot>
    {STAGE_LABELS[stage]}
  </Badge>
);

export const TaskStatusBadge = ({ status }: { status: TaskStatus }) => (
  <Badge tone={TASK_TONE[status]} dot>{TASK_STATUS_LABELS[status]}</Badge>
);

export const PriorityLabel = ({ priority }: { priority: TaskPriority }) => (
  <span className={`prio prio-${priority}`}>{PRIORITY_LABELS[priority]}</span>
);
