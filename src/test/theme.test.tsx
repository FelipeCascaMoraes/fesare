import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { THEME_STORAGE_KEY } from '@/theme/ThemeContext';
import { createLocalDataSource, loadAll } from '@/data/localDataSource';
import { renderApp } from './renderApp';

const heading = (name: string) => screen.findByRole('heading', { level: 1, name });

afterEach(() => {
  delete document.documentElement.dataset.theme;
});

describe('tema claro/escuro', () => {
  it('alterna imediatamente pelo cabeçalho e persiste a escolha', async () => {
    const user = userEvent.setup();
    const { unmount } = renderApp('/');
    await heading('Dashboard');
    expect(document.documentElement.dataset.theme).toBe('light'); // jsdom não tem preferência de sistema

    await user.click(screen.getByRole('button', { name: 'Usar tema escuro' }));
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');

    // "Reabrir" o aplicativo mantém o tema.
    unmount();
    renderApp('/');
    await heading('Dashboard');
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(screen.getByRole('button', { name: 'Usar tema claro' })).toBeInTheDocument();
  });

  it('permite escolher a aparência no menu do perfil e em Configurações', async () => {
    const user = userEvent.setup();
    renderApp('/configuracoes');
    await heading('Configurações');
    await user.click(screen.getByRole('radio', { name: 'Escuro' }));
    expect(document.documentElement.dataset.theme).toBe('dark');

    await user.click(screen.getByRole('button', { name: 'Perfil e aparência' }));
    await user.click(screen.getByRole('menuitemradio', { name: 'Claro' }));
    expect(document.documentElement.dataset.theme).toBe('light');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light');
  });
});

describe('menu lateral', () => {
  it('recolhe e lembra o estado', async () => {
    const user = userEvent.setup();
    const { container, unmount } = renderApp('/');
    await heading('Dashboard');
    await user.click(screen.getByRole('button', { name: 'Recolher menu' }));
    expect(container.querySelector('.app-shell')).toHaveClass('collapsed');
    unmount();

    const again = renderApp('/');
    await heading('Dashboard');
    expect(again.container.querySelector('.app-shell')).toHaveClass('collapsed');
    // Os links continuam acessíveis pelo nome mesmo recolhidos.
    expect(screen.getByRole('link', { name: 'Orçamentos' })).toBeInTheDocument();
  });
});

describe('notificações', () => {
  it('lista atividades e marca como lidas', async () => {
    const user = userEvent.setup();
    renderApp('/');
    await heading('Dashboard');
    await user.click(screen.getByRole('button', { name: /Notificações \(\d+ não lidas\)/ }));
    expect(screen.getByRole('dialog', { name: 'Notificações' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Marcar como lidas' }));
    expect(screen.getByRole('button', { name: 'Notificações' })).toBeInTheDocument();
  });
});

describe('migração do armazenamento antigo', () => {
  it('preserva os registros salvos com o prefixo anterior', async () => {
    localStorage.setItem('fezari:v1:initialized', '2026-01-01');
    localStorage.setItem('fezari:v1:clients', JSON.stringify([{ id: 'c1', name: 'Cliente antigo', isDemo: false, createdAt: '', updatedAt: '' }]));
    localStorage.setItem('fezari:v1:settings', JSON.stringify({ companyName: 'Fezari', quoteValidityDays: 10 }));

    const ds = createLocalDataSource();
    const all = await loadAll(ds);
    expect(all.clients.map((c) => c.name)).toEqual(['Cliente antigo']);
    expect(await ds.getSettings()).toMatchObject({ companyName: 'Fesare', quoteValidityDays: 10 });
    expect(localStorage.getItem('fezari:v1:clients')).toBeNull();
  });
});
