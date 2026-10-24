import {
  AppWindow,
  BarChart3,
  BookOpen,
  CalendarDays,
  Diamond,
  DoorOpen,
  Fence,
  FileText,
  HardHat,
  KeyRound,
  Layers,
  LayoutDashboard,
  ListChecks,
  Palette,
  Ruler,
  Settings,
  Users,
  type LucideIcon,
} from 'lucide-react';
import type { CatalogCategory } from '@/domain/types';

export interface NavItem { label: string; to: string; icon: LucideIcon }
export interface NavGroup { title: string; items: NavItem[] }

/** Seções do catálogo: cada página do menu filtra uma ou mais categorias. */
export interface CatalogSection {
  slug: string;
  label: string;
  description: string;
  categories: CatalogCategory[];
  icon: LucideIcon;
}

export const CATALOG_SECTIONS: CatalogSection[] = [
  { slug: 'esquadrias-aluminio', label: 'Esquadrias de alumínio', description: 'Janelas, portas e fachadas em alumínio.', categories: ['esquadrias_aluminio'], icon: AppWindow },
  { slug: 'portas-madeira', label: 'Portas de madeira', description: 'Portas de giro, pivotantes e de correr em madeira.', categories: ['portas_madeira'], icon: DoorOpen },
  { slug: 'portoes', label: 'Portões', description: 'Portões basculantes, deslizantes e de giro.', categories: ['portoes'], icon: Fence },
  { slug: 'linhas-perfis', label: 'Linhas e perfis', description: 'Linhas de fabricação e perfis de alumínio.', categories: ['linhas', 'perfis'], icon: Layers },
  { slug: 'cores-acabamentos', label: 'Cores e acabamentos', description: 'Pinturas, anodizações e acabamentos.', categories: ['cores'], icon: Palette },
  { slug: 'vidros-acessorios', label: 'Vidros e acessórios', description: 'Tipos de vidro, ferragens e componentes.', categories: ['vidros', 'acessorios'], icon: Diamond },
];

export const CATEGORY_ICONS: Record<CatalogCategory, LucideIcon> = {
  esquadrias_aluminio: AppWindow,
  portas_madeira: DoorOpen,
  portoes: Fence,
  linhas: Layers,
  perfis: Ruler,
  cores: Palette,
  vidros: Diamond,
  acessorios: KeyRound,
};

export const NAVIGATION: NavGroup[] = [
  {
    title: 'GESTÃO',
    items: [
      { label: 'Dashboard', to: '/', icon: LayoutDashboard },
      { label: 'Orçamentos', to: '/orcamentos', icon: FileText },
      { label: 'Obras', to: '/obras', icon: HardHat },
      { label: 'Calendário', to: '/calendario', icon: CalendarDays },
      { label: 'Tarefas', to: '/tarefas', icon: ListChecks },
    ],
  },
  {
    title: 'CATÁLOGO',
    items: [
      { label: 'Base de conhecimento', to: '/catalogo', icon: BookOpen },
      ...CATALOG_SECTIONS.map((s) => ({ label: s.label, to: `/catalogo/${s.slug}`, icon: s.icon })),
    ],
  },
  {
    title: 'ADMINISTRAÇÃO',
    items: [
      { label: 'Clientes', to: '/clientes', icon: Users },
      { label: 'Relatórios', to: '/relatorios', icon: BarChart3 },
      { label: 'Configurações', to: '/configuracoes', icon: Settings },
    ],
  },
];

/** Título da página atual para a barra superior. */
export function findNavLabel(pathname: string): { group: string; label: string } | undefined {
  let best: { group: string; label: string; len: number } | undefined;
  for (const g of NAVIGATION) {
    for (const i of g.items) {
      const match = i.to === '/' ? pathname === '/' : pathname === i.to || pathname.startsWith(i.to + '/');
      if (match && (!best || i.to.length > best.len)) best = { group: g.title, label: i.label, len: i.to.length };
    }
  }
  return best;
}
