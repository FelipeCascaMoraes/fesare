import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { AlertTriangle, FlaskConical, Info, type LucideIcon } from 'lucide-react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

export function Button({
  variant = 'primary',
  size,
  icon: Icon,
  loading,
  children,
  className = '',
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: 'sm';
  icon?: LucideIcon;
  loading?: boolean;
}) {
  return (
    <button
      type="button"
      className={`btn btn-${variant} ${size === 'sm' ? 'btn-sm' : ''} ${className}`}
      disabled={loading || rest.disabled}
      {...rest}
    >
      {loading ? <span className="spinner" style={{ width: 14, height: 14 }} /> : Icon && <Icon />}
      {children}
    </button>
  );
}

export function IconButton({
  icon: Icon,
  label,
  danger,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { icon: LucideIcon; label: string; danger?: boolean }) {
  return (
    <button type="button" className={`icon-btn ${danger ? 'danger' : ''}`} aria-label={label} title={label} {...rest}>
      <Icon />
    </button>
  );
}

export type Tone = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'accent' | 'muted';

export function Badge({ tone = 'default', dot, children }: { tone?: Tone; dot?: boolean; children: ReactNode }) {
  return <span className={`badge ${tone !== 'default' ? `badge-${tone}` : ''} ${dot ? 'badge-dot' : ''}`}>{children}</span>;
}

/** Selo que identifica um registro de demonstração. */
export function DemoTag({ show = true }: { show?: boolean }) {
  if (!show) return null;
  return (
    <span className="demo-tag" title="Registro demonstrativo — não é um dado real">
      Demo
    </span>
  );
}

export function Banner({
  tone = 'info',
  title,
  children,
}: {
  tone?: 'demo' | 'info' | 'warning' | 'danger';
  title?: string;
  children: ReactNode;
}) {
  const Icon = tone === 'demo' ? FlaskConical : tone === 'info' ? Info : AlertTriangle;
  return (
    <div className={`banner banner-${tone}`} role={tone === 'danger' ? 'alert' : 'note'}>
      <Icon />
      <div>
        {title && <strong>{title} </strong>}
        {children}
      </div>
    </div>
  );
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="page-header">
      <div>
        <h1 className="page-title">{title}</h1>
        {subtitle && <p className="page-subtitle">{subtitle}</p>}
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </div>
  );
}

export function Card({ title, subtitle, actions, children, pad, className = '' }: {
  title?: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  pad?: boolean;
  className?: string;
}) {
  return (
    <section className={`card ${className}`}>
      {(title || actions) && (
        <div className="card-header">
          <div>
            {title && <h2 className="card-title">{title}</h2>}
            {subtitle && <p className="card-sub">{subtitle}</p>}
          </div>
          {actions}
        </div>
      )}
      <div className={title || actions ? 'card-body' : pad ? 'card-pad' : ''}>{children}</div>
    </section>
  );
}

export function EmptyState({ icon: Icon, title, description, action }: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty">
      <div className="empty-icon"><Icon /></div>
      <h3>{title}</h3>
      {description && <p>{description}</p>}
      {action}
    </div>
  );
}

export function Skeleton({ height = 16, width = '100%' }: { height?: number; width?: number | string }) {
  return <div className="skeleton" style={{ height, width }} aria-hidden />;
}

export function PageSkeleton() {
  return (
    <div className="page" aria-busy="true" aria-label="Carregando">
      <Skeleton height={30} width={260} />
      <div className="mt-2"><Skeleton height={14} width={380} /></div>
      <div className="grid grid-stats mt-6">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="card card-pad"><Skeleton height={80} /></div>
        ))}
      </div>
      <div className="card card-pad mt-6"><Skeleton height={260} /></div>
    </div>
  );
}

export function initials(name?: string) {
  if (!name) return '—';
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');
}

export function Avatar({ name, small }: { name?: string; small?: boolean }) {
  return (
    <span className={`avatar ${small ? 'avatar-sm' : ''}`} title={name}>
      {initials(name)}
    </span>
  );
}
