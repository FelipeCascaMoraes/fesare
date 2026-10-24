import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NAVIGATION } from '@/layout/navigation';
import { renderApp } from './renderApp';

const heading = (name: string | RegExp) => screen.findByRole('heading', { level: 1, name });

describe('navegação', () => {
  it('todas as páginas do menu abrem e o item ativo é destacado', async () => {
    const user = userEvent.setup();
    renderApp('/');
    await heading('Dashboard');
    const nav = screen.getByRole('complementary', { name: 'Menu principal' });

    for (const item of NAVIGATION.flatMap((g) => g.items)) {
      await user.click(within(nav).getByRole('link', { name: item.label }));
      await heading(item.label);
      expect(within(nav).getByRole('link', { name: item.label })).toHaveClass('active');
    }
  });

  it('mostra página não encontrada para rotas inválidas', async () => {
    renderApp('/nao-existe');
    expect(await screen.findByText('Página não encontrada')).toBeInTheDocument();
  });
});

describe('dashboard', () => {
  it('identifica dados demonstrativos', async () => {
    renderApp('/');
    expect(await screen.findByText(/Dados demonstrativos\./)).toBeInTheDocument();
    expect(screen.getByLabelText(/Obras em andamento: \d+/)).toBeInTheDocument();
  });
});

describe('obras', () => {
  it('altera a etapa pelo seletor do cartão', async () => {
    const user = userEvent.setup();
    renderApp('/obras');
    await heading('Obras');
    await user.selectOptions(screen.getByLabelText('Alterar etapa de Sobrado Valinhos'), 'em_producao');
    const column = screen.getByRole('region', { name: 'Em produção' });
    await waitFor(() => expect(within(column).getByText('Sobrado Valinhos')).toBeInTheDocument());
    expect(await screen.findByText(/movida para Em produção\./)).toBeInTheDocument();
  });
});

describe('clientes', () => {
  it('valida o formulário e cadastra um cliente', async () => {
    const user = userEvent.setup();
    renderApp('/clientes');
    await heading('Clientes');
    await user.click(screen.getByRole('button', { name: 'Novo cliente' }));
    await user.click(screen.getByRole('button', { name: 'Salvar cliente' }));
    expect(await screen.findByText(/Informe o nome do cliente/)).toBeInTheDocument();

    await user.type(screen.getByLabelText(/Nome \/ razão social/), 'Joana Lima');
    await user.click(screen.getByRole('button', { name: 'Salvar cliente' }));
    expect(await screen.findByText('Joana Lima')).toBeInTheDocument();
    expect(screen.getByText('Cliente cadastrado.')).toBeInTheDocument();
  });

  it('impede excluir cliente com obras vinculadas', async () => {
    const user = userEvent.setup();
    renderApp('/clientes');
    await heading('Clientes');
    await user.click(screen.getByRole('button', { name: 'Excluir Mariana Alves (exemplo)' }));
    await user.click(screen.getByRole('button', { name: 'Excluir' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/não pode ser excluído/);
  });
});

describe('orçamentos', () => {
  it('não envia para aprovação sem itens e salva rascunho com item', async () => {
    const user = userEvent.setup();
    renderApp('/orcamentos/novo');
    await heading('Novo orçamento');

    await user.click(screen.getByRole('button', { name: 'Enviar para aprovação' }));
    expect(await screen.findByText('Selecione o cliente')).toBeInTheDocument();
    expect(screen.getByText(/Adicione pelo menos um item/)).toBeInTheDocument();

    await user.selectOptions(screen.getByRole('combobox', { name: 'Cliente' }), 'demo-c2');
    await user.click(screen.getAllByRole('button', { name: 'Adicionar item' })[0]);
    const dialog = screen.getByRole('dialog');
    await user.type(within(dialog).getByLabelText(/^Modelo/), 'Janela teste');
    await user.type(within(dialog).getByLabelText(/^Largura/), '1000');
    await user.type(within(dialog).getByLabelText(/^Altura/), '1000');
    await user.clear(within(dialog).getByLabelText(/^Quantidade/));
    await user.type(within(dialog).getByLabelText(/^Quantidade/), '2');
    await user.type(within(dialog).getByLabelText(/^Valor unitário/), '150');
    await user.click(within(dialog).getByRole('button', { name: 'Adicionar item' }));

    expect(await screen.findByText('Janela teste')).toBeInTheDocument();
    expect(screen.getAllByText('R$ 300,00').length).toBeGreaterThan(0);

    await user.click(screen.getByRole('button', { name: 'Salvar rascunho' }));
    expect(await heading(/^ORC-\d{4}-0001$/)).toBeInTheDocument();
  });
});

describe('base de conhecimento', () => {
  it('filtra por categoria e pesquisa', async () => {
    const user = userEvent.setup();
    renderApp('/catalogo');
    await heading('Base de conhecimento');
    await user.click(screen.getByRole('button', { name: /^Portões/ }));
    expect(screen.getByText('Portão basculante (exemplo)')).toBeInTheDocument();
    expect(screen.queryByText('Maxim-ar (exemplo)')).not.toBeInTheDocument();
    await user.type(screen.getByLabelText('Pesquisar no catálogo'), 'deslizante');
    expect(screen.queryByText('Portão basculante (exemplo)')).not.toBeInTheDocument();
    expect(screen.getByText('Portão deslizante (exemplo)')).toBeInTheDocument();
  });

  it('arquiva e restaura um item', async () => {
    const user = userEvent.setup();
    renderApp('/catalogo/portoes');
    await heading('Portões');
    await user.click(screen.getByRole('button', { name: 'Arquivar Portão basculante (exemplo)' }));
    await user.click(screen.getByRole('button', { name: 'Arquivar' }));
    await waitFor(() => expect(screen.queryByText('Portão basculante (exemplo)')).not.toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: 'Arquivados' }));
    await user.click(screen.getByRole('button', { name: 'Restaurar Portão basculante (exemplo)' }));
    expect(await screen.findByText('Item restaurado.')).toBeInTheDocument();
  });

  it('importação mostra pré-visualização sem afirmar que importou', async () => {
    const user = userEvent.setup();
    renderApp('/catalogo');
    await heading('Base de conhecimento');
    await user.click(screen.getByRole('button', { name: 'Importar dados' }));
    const file = new File(['codigo;nome\nP1;Perfil A\n'], 'perfis.csv', { type: 'text/csv' });
    await user.upload(screen.getByTestId('import-input'), file);
    expect(await screen.findByText('perfis.csv')).toBeInTheDocument();
    expect(screen.getByText('Perfil A')).toBeInTheDocument();
    expect(screen.getByText('Não importado')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Processar importação' })).toBeDisabled();
  });
});

describe('configurações', () => {
  it('remove os dados demonstrativos mantendo os reais', async () => {
    const user = userEvent.setup();
    renderApp('/configuracoes');
    await heading('Configurações');
    await user.click(screen.getByRole('button', { name: 'Remover dados demonstrativos' }));
    await user.click(screen.getByRole('button', { name: 'Remover' }));
    expect(await screen.findByText('Dados demonstrativos removidos.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Remover dados demonstrativos' })).toBeDisabled();
  });
});
