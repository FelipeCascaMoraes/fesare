import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { useData } from '@/data/DataContext';
import { Button, Card, DemoTag, EmptyState, IconButton, PageHeader } from '@/components/ui';
import { formatDate, parseISODate, toISODate, todayISO } from '@/domain/dates';
import type { Project, Task } from '@/domain/types';

type EventKind = 'install' | 'deadline' | 'task';

export interface CalendarEvent {
  id: string;
  date: string;
  kind: EventKind;
  title: string;
  link: string;
  isDemo: boolean;
}

const KIND_LABEL: Record<EventKind, string> = { install: 'Instalação', deadline: 'Prazo de obra', task: 'Tarefa' };

/** Eventos são derivados de obras e tarefas — o calendário não guarda dados próprios. */
export function buildEvents(projects: Project[], tasks: Task[]): CalendarEvent[] {
  const events: CalendarEvent[] = [];
  for (const p of projects) {
    if (p.installationDate) events.push({ id: `i-${p.id}`, date: p.installationDate, kind: 'install', title: p.name, link: `/obras/${p.id}`, isDemo: p.isDemo });
    if (p.deadline && p.stage !== 'concluido') events.push({ id: `d-${p.id}`, date: p.deadline, kind: 'deadline', title: p.name, link: `/obras/${p.id}`, isDemo: p.isDemo });
  }
  for (const t of tasks) {
    if (t.dueDate && t.status !== 'concluida') events.push({ id: `t-${t.id}`, date: t.dueDate, kind: 'task', title: t.title, link: '/tarefas', isDemo: t.isDemo });
  }
  return events;
}

const DOW = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const monthTitle = (d: Date) => {
  const s = d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  return s.charAt(0).toUpperCase() + s.slice(1);
};

export function CalendarPage() {
  const { projects, tasks } = useData();
  const navigate = useNavigate();
  const today = todayISO();
  const [cursor, setCursor] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const [selected, setSelected] = useState<string>(today);
  const [kinds, setKinds] = useState<Record<EventKind, boolean>>({ install: true, deadline: true, task: true });

  const events = useMemo(() => buildEvents(projects, tasks).filter((e) => kinds[e.kind]), [projects, tasks, kinds]);
  const byDate = useMemo(() => {
    const m = new Map<string, CalendarEvent[]>();
    for (const e of events) m.set(e.date, [...(m.get(e.date) ?? []), e]);
    return m;
  }, [events]);

  const start = new Date(cursor);
  start.setDate(1 - cursor.getDay());
  const days = Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });

  const shift = (n: number) => setCursor((c) => new Date(c.getFullYear(), c.getMonth() + n, 1));
  const selectedEvents = byDate.get(selected) ?? [];

  return (
    <div className="page">
      <PageHeader title="Calendário" subtitle="Instalações, prazos de obras e tarefas em um só lugar." />

      <Card pad>
        <div className="cal-toolbar">
          <div className="cal-head">
            <IconButton icon={ChevronLeft} label="Mês anterior" onClick={() => shift(-1)} />
            <h2>{monthTitle(cursor)}</h2>
            <IconButton icon={ChevronRight} label="Próximo mês" onClick={() => shift(1)} />
            <Button variant="secondary" size="sm" onClick={() => { const d = new Date(); setCursor(new Date(d.getFullYear(), d.getMonth(), 1)); setSelected(today); }}>Hoje</Button>
          </div>
          <div className="chips" role="group" aria-label="Tipos de evento">
            {(Object.keys(KIND_LABEL) as EventKind[]).map((k) => (
              <button key={k} type="button" className={`chip ${kinds[k] ? 'active' : ''}`} aria-pressed={kinds[k]} onClick={() => setKinds((s) => ({ ...s, [k]: !s[k] }))}>
                {KIND_LABEL[k]}
              </button>
            ))}
          </div>
        </div>

        <div className="cal-frame">
          <div className="cal-grid" role="grid" aria-label="Calendário mensal">
            {DOW.map((d) => <div key={d} className="cal-dow" role="columnheader">{d}</div>)}
            {days.map((d) => {
              const iso = toISODate(d);
              const evs = byDate.get(iso) ?? [];
              const out = d.getMonth() !== cursor.getMonth();
              return (
                <div
                  key={iso}
                  role="gridcell"
                  className={`cal-cell ${out ? 'out' : ''} ${iso === today ? 'today' : ''} ${iso === selected ? 'selected' : ''}`}
                  onClick={() => setSelected(iso)}
                  aria-label={`${formatDate(iso)}: ${evs.length} eventos`}
                >
                  <span className="cal-day">{d.getDate()}</span>
                  {evs.slice(0, 3).map((e) => (
                    <button key={e.id} type="button" className={`cal-ev ${e.kind}`} title={`${KIND_LABEL[e.kind]}: ${e.title}`} onClick={(ev) => { ev.stopPropagation(); navigate(e.link); }}>
                      {e.title}
                    </button>
                  ))}
                  {evs.length > 3 && <span className="small muted">+{evs.length - 3} mais</span>}
                </div>
              );
            })}
          </div>
        </div>

        <div className="legend mt-4">
          <span><i className="l-install" />Instalação</span>
          <span><i className="l-deadline" />Prazo de obra</span>
          <span><i className="l-task" />Tarefa</span>
        </div>
      </Card>

      <Card className="mt-6" title={`Agenda de ${parseISODate(selected).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}`}>
        {selectedEvents.length === 0 ? (
          <EmptyState icon={CalendarDays} title="Nada agendado neste dia" description="Datas de instalação, prazos de obras e tarefas aparecem aqui automaticamente." />
        ) : (
          <ul className="list-plain">
            {selectedEvents.map((e) => (
              <li key={e.id}>
                <div>
                  <button type="button" className="cell-main unstyled-btn" onClick={() => navigate(e.link)}>{e.title}</button>{' '}
                  <DemoTag show={e.isDemo} />
                </div>
                <span className={`cal-ev inline ${e.kind}`}>{KIND_LABEL[e.kind]}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
