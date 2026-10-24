import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  AlertTriangle,
  Bell,
  Check,
  Laptop,
  Menu,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  RefreshCw,
  Settings as SettingsIcon,
  Sun,
} from 'lucide-react';
import { BrandLogo } from '@/brand/BrandLogo';
import { Avatar, Button, EmptyState, PageSkeleton } from '@/components/ui';
import { useData } from '@/data/DataContext';
import { resetLocalStorage } from '@/data/localDataSource';
import { relativeTime } from '@/domain/dates';
import { useTheme, type ThemePreference } from '@/theme/ThemeContext';
import { NAVIGATION, findNavLabel } from './navigation';

const COLLAPSE_KEY = 'fesare:sidebar-collapsed';
const SEEN_KEY = 'fesare:notifications-seen';

function readLocal(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
function writeLocal(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* preferência só vale para esta sessão */
  }
}

/** Abre/fecha um menu suspenso; fecha ao clicar fora ou com Esc. */
function useDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);
  return { open, setOpen, ref };
}

function Sidebar({ open, collapsed, onToggleCollapse, onNavigate }: {
  open: boolean;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onNavigate: () => void;
}) {
  return (
    <aside className={`sidebar ${open ? 'open' : ''}`} aria-label="Menu principal">
      <Link to="/" className="brand" onClick={onNavigate} aria-label="Fesare — ir para o Dashboard">
        <BrandLogo compact={collapsed} />
      </Link>
      <nav className="sidebar-scroll">
        {NAVIGATION.map((group) => (
          <div className="nav-group" key={group.title}>
            <div className="nav-group-title">{group.title}</div>
            {group.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/' || item.to === '/catalogo'}
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                onClick={onNavigate}
                title={collapsed ? item.label : undefined}
                aria-label={item.label}
              >
                <item.icon aria-hidden />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>
        ))}
      </nav>
      <div className="sidebar-footer">
        <button type="button" className="collapse-toggle" onClick={onToggleCollapse} aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'} title={collapsed ? 'Expandir menu' : undefined}>
          {collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
          <span className="collapse-label">Recolher menu</span>
        </button>
      </div>
    </aside>
  );
}

function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const label = theme === 'dark' ? 'Usar tema claro' : 'Usar tema escuro';
  return (
    <button type="button" className="icon-btn" onClick={toggle} aria-label={label} title={label}>
      {theme === 'dark' ? <Sun /> : <Moon />}
    </button>
  );
}

function Notifications() {
  const { activities } = useData();
  const { open, setOpen, ref } = useDropdown();
  const [seen, setSeen] = useState(() => readLocal(SEEN_KEY) ?? '');
  const recent = [...activities].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 12);
  const unread = activities.filter((a) => a.createdAt > seen).length;

  const markRead = () => {
    const now = new Date().toISOString();
    setSeen(now);
    writeLocal(SEEN_KEY, now);
  };

  return (
    <div className="dropdown" ref={ref}>
      <button type="button" className="icon-btn" aria-label={unread ? `Notificações (${unread} não lidas)` : 'Notificações'} aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <Bell />
        {unread > 0 && <span className="dot-badge" aria-hidden>{unread > 9 ? '9+' : unread}</span>}
      </button>
      {open && (
        <div className="menu" role="dialog" aria-label="Notificações">
          <div className="menu-header">
            <span className="menu-title">Notificações</span>
            {unread > 0 && <Button variant="ghost" size="sm" icon={Check} onClick={markRead}>Marcar como lidas</Button>}
          </div>
          <div className="menu-list">
            {recent.length === 0 ? (
              <p className="small muted menu-empty">Nenhuma atividade registrada ainda.</p>
            ) : (
              recent.map((a) => (
                <div key={a.id} className={`notif ${a.createdAt > seen ? 'unread' : ''}`}>
                  <div>
                    <div className="notif-msg">{a.message}</div>
                    <div className="notif-time">{relativeTime(a.createdAt)}{a.isDemo ? ' · demonstrativo' : ''}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const THEME_OPTIONS: { value: ThemePreference; label: string; icon: typeof Sun }[] = [
  { value: 'light', label: 'Claro', icon: Sun },
  { value: 'dark', label: 'Escuro', icon: Moon },
  { value: 'system', label: 'Seguir o sistema', icon: Laptop },
];

function ProfileMenu() {
  const { preference, setPreference } = useTheme();
  const { open, setOpen, ref } = useDropdown();
  return (
    <div className="dropdown" ref={ref}>
      <button type="button" className="icon-btn" aria-label="Perfil e aparência" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <Avatar small name="Administrador" />
      </button>
      {open && (
        <div className="menu menu-sm" role="menu" aria-label="Perfil e aparência">
          <div className="menu-header">
            <div>
              <div className="menu-title">Administrador</div>
              <div className="small muted">Acesso local · sem login</div>
            </div>
          </div>
          <div className="menu-sep" />
          <div className="menu-label">Aparência</div>
          {THEME_OPTIONS.map((o) => (
            <button
              key={o.value}
              type="button"
              role="menuitemradio"
              aria-checked={preference === o.value}
              className={`menu-item ${preference === o.value ? 'active' : ''}`}
              onClick={() => setPreference(o.value)}
            >
              <o.icon />
              <span className="grow">{o.label}</span>
              {preference === o.value && <Check />}
            </button>
          ))}
          <div className="menu-sep" />
          <Link to="/configuracoes" className="menu-item" role="menuitem" onClick={() => setOpen(false)}>
            <SettingsIcon />
            Configurações
          </Link>
        </div>
      )}
    </div>
  );
}

function ErrorScreen({ message, onRetry }: { message?: string; onRetry: () => void }): ReactNode {
  return (
    <div className="page">
      <div className="card">
        <EmptyState
          icon={AlertTriangle}
          title="Não foi possível carregar os dados"
          description={message}
          action={
            <div className="row">
              <Button variant="secondary" icon={RefreshCw} onClick={onRetry}>Tentar novamente</Button>
              <Button
                variant="danger"
                onClick={() => {
                  if (window.confirm('Isso apaga todos os dados salvos neste navegador. Continuar?')) {
                    resetLocalStorage();
                    window.location.reload();
                  }
                }}
              >
                Restaurar dados locais
              </Button>
            </div>
          }
        />
      </div>
    </div>
  );
}

export function AppLayout() {
  const { status, error, reload } = useData();
  const [menuOpen, setMenuOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => readLocal(COLLAPSE_KEY) === '1');
  const { pathname } = useLocation();
  const current = findNavLabel(pathname);

  useEffect(() => {
    window.scrollTo?.(0, 0);
  }, [pathname]);

  const toggleCollapse = () =>
    setCollapsed((c) => {
      writeLocal(COLLAPSE_KEY, c ? '0' : '1');
      return !c;
    });

  return (
    <div className={`app-shell ${collapsed ? 'collapsed' : ''}`}>
      <Sidebar open={menuOpen} collapsed={collapsed} onToggleCollapse={toggleCollapse} onNavigate={() => setMenuOpen(false)} />
      <div className={`sidebar-backdrop ${menuOpen ? 'open' : ''}`} onClick={() => setMenuOpen(false)} />
      <div className="main">
        <header className="topbar">
          <button className="icon-btn menu-toggle" aria-label="Abrir menu" onClick={() => setMenuOpen(true)}>
            <Menu />
          </button>
          <div className="topbar-title">
            {current ? (
              <>
                <span className="group">{current.group.charAt(0) + current.group.slice(1).toLowerCase()} / </span>
                {current.label}
              </>
            ) : (
              'Fesare'
            )}
          </div>
          <div className="spacer" />
          <div className="topbar-actions">
            {status === 'ready' && <Notifications />}
            <ThemeToggle />
            <ProfileMenu />
          </div>
        </header>

        {status === 'loading' && <PageSkeleton />}
        {status === 'error' && <ErrorScreen message={error} onRetry={reload} />}
        {status === 'ready' && <Outlet />}
      </div>
    </div>
  );
}
