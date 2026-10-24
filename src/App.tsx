import { BrowserRouter, Link, Route, Routes, useParams } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { DataProvider } from '@/data/DataContext';
import type { DataSource } from '@/data/dataSource';
import { ToastProvider } from '@/components/Toast';
import { ThemeProvider } from '@/theme/ThemeContext';
import { EmptyState } from '@/components/ui';
import { AppLayout } from '@/layout/AppLayout';
import { CATALOG_SECTIONS } from '@/layout/navigation';
import { Dashboard } from '@/pages/Dashboard';
import { QuotesList } from '@/pages/quotes/QuotesList';
import { QuoteEditor } from '@/pages/quotes/QuoteEditor';
import { QuotePreview } from '@/pages/quotes/QuotePreview';
import { ProjectsBoard } from '@/pages/projects/ProjectsBoard';
import { ProjectDetail } from '@/pages/projects/ProjectDetail';
import { CalendarPage } from '@/pages/CalendarPage';
import { Tasks } from '@/pages/Tasks';
import { KnowledgeBase } from '@/pages/knowledge/KnowledgeBase';
import { Clients } from '@/pages/Clients';
import { Reports } from '@/pages/Reports';
import { Settings } from '@/pages/Settings';

function NotFound() {
  return (
    <div className="page">
      <div className="card">
        <EmptyState icon={Compass} title="Página não encontrada" description="O endereço acessado não existe." action={<Link className="btn btn-primary" to="/">Ir para o Dashboard</Link>} />
      </div>
    </div>
  );
}

/** Remonta o editor ao trocar de orçamento. */
function QuoteEditorRoute() {
  const { id } = useParams();
  return <QuoteEditor key={id ?? 'novo'} />;
}

function CatalogSectionRoute() {
  const { slug } = useParams();
  const section = CATALOG_SECTIONS.find((s) => s.slug === slug);
  if (!section) return <NotFound />;
  return <KnowledgeBase key={section.slug} section={section} />;
}

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="orcamentos" element={<QuotesList />} />
        <Route path="orcamentos/novo" element={<QuoteEditorRoute />} />
        <Route path="orcamentos/:id" element={<QuoteEditorRoute />} />
        <Route path="orcamentos/:id/visualizar" element={<QuotePreview />} />
        <Route path="obras" element={<ProjectsBoard />} />
        <Route path="obras/:id" element={<ProjectDetail />} />
        <Route path="calendario" element={<CalendarPage />} />
        <Route path="tarefas" element={<Tasks />} />
        <Route path="catalogo" element={<KnowledgeBase key="all" />} />
        <Route path="catalogo/:slug" element={<CatalogSectionRoute />} />
        <Route path="clientes" element={<Clients />} />
        <Route path="relatorios" element={<Reports />} />
        <Route path="configuracoes" element={<Settings />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

export function Providers({ children, source }: { children: React.ReactNode; source?: DataSource }) {
  return (
    <ThemeProvider>
      <ToastProvider>
        <DataProvider source={source}>{children}</DataProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Providers>
        <AppRoutes />
      </Providers>
    </BrowserRouter>
  );
}
