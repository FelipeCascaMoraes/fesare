# Fesare — Soluções em Alumínio · Sistema administrativo

Sistema web administrativo da Fesare (esquadrias de alumínio, portas de madeira e portões).

> **Etapa atual: fundação.** Interface, navegação e módulos principais funcionando com
> dados salvos no navegador. A base de conhecimento real, a leitura de PDFs por IA e o
> motor de cálculo de orçamentos serão integrados nas próximas etapas.

## Como rodar

Requer Node.js 20 ou superior.

```bash
npm install
npm run dev        # servidor de desenvolvimento (http://localhost:5173)
npm test           # testes (Vitest + Testing Library)
npm run typecheck  # checagem de tipos
npm run build      # typecheck + build de produção em dist/
```

## Módulos

| Área | Rotas | O que já funciona |
| --- | --- | --- |
| Dashboard | `/` | Indicadores, obras por etapa, atividades recentes, próximas instalações |
| Orçamentos | `/orcamentos`, `/orcamentos/novo`, `/orcamentos/:id`, `/orcamentos/:id/visualizar` | Histórico com filtros, editor (cliente/obra, itens, desconto, totais), rascunho, envio para aprovação, pré-visualização imprimível |
| Obras | `/obras`, `/obras/:id` | Kanban com 7 etapas (arrastar ou seletor), detalhe da obra com orçamentos e tarefas vinculados |
| Calendário | `/calendario` | Visão mensal derivada das obras (instalação, prazo) e das tarefas |
| Tarefas | `/tarefas` | Prazo, prioridade, responsável, status e vínculo com a obra |
| Catálogo | `/catalogo`, `/catalogo/:secao` | Pesquisa, filtros por categoria, cadastro, edição, arquivamento, importação (somente pré-visualização) |
| Clientes | `/clientes` | Cadastro com validação; exclusão bloqueada se houver obras ou orçamentos vinculados |
| Relatórios | `/relatorios` | Orçamentos por status, obras por etapa, carga da equipe |
| Configurações | `/configuracoes` | Dados da empresa, remover ou recarregar dados demonstrativos |

## Arquitetura

```
src/
  domain/        Tipos, rótulos, validação (zod) e regras puras (totais do orçamento, datas)
  data/
    dataSource.ts        Contrato assíncrono de acesso a dados (Repository/DataSource)
    localDataSource.ts   Implementação atual: armazenamento local do navegador
    demo/seed.ts         DADOS DEMONSTRATIVOS (isolados, todos com isDemo = true)
    DataContext.tsx      Estado da aplicação e ações (salvar, mover, arquivar…)
  lib/           Utilitários (formatos de importação, ids)
  components/    UI reutilizável (botões, cartões, modal, formulários, toasts)
  layout/        Menu lateral, barra superior, definição da navegação
  pages/         Telas de cada módulo
  styles/        Design system (tokens de cor, tipografia, componentes)
database/
  schema.sql     Esquema PostgreSQL alvo
```

**Princípios**

- **Dados demonstrativos separados:** ficam em `src/data/demo/seed.ts`, são marcados com
  `isDemo` e aparecem na interface com o selo **DEMO**. Podem ser removidos em
  Configurações sem afetar os registros reais.
- **Sem duplicação:** as entidades se relacionam por id. O calendário e os relatórios são
  calculados a partir das obras, tarefas e orçamentos, sem armazenamento próprio.
- **Troca da camada de dados:** as telas só usam `DataContext`, que depende da interface
  `DataSource`. Para usar um backend, implemente um `DataSource` HTTP e passe-o ao
  `DataProvider`. Nenhuma tela precisa mudar.
- **Sem chaves no frontend:** IA, armazenamento de arquivos e qualquer serviço com segredo
  devem ficar no backend (veja `.env.example`).

## O que ainda não foi implementado

- **Motor de cálculo:** o valor unitário de cada item é digitado manualmente. O ponto de
  integração é `src/domain/quote.ts`, e o banco já prevê `price_source` e `price_breakdown`.
- **Importação da base de conhecimento:** a tela seleciona arquivos, identifica o formato
  e pré-visualiza CSV, texto, imagens e PDFs no navegador. **Nenhum dado é gravado.** O
  processamento (XLSX, mapeamento de colunas, extração de PDFs por IA no servidor) entra
  em `src/lib/importFormats.ts` e na tabela `import_files`.
- **Backend, autenticação e usuários:** os dados ficam apenas no navegador atual.
- **Geração do documento oficial (PDF) do orçamento.**

## Identidade visual e temas

- **Tokens de design** em `src/styles/global.css`: todas as cores, bordas, raios e sombras
  são variáveis CSS. O tema claro e o escuro só redefinem esses tokens
  (`:root[data-theme='light' | 'dark']`). Novas telas devem usar os tokens e as classes
  existentes, sem cores fixas.
- **Paleta:** amarelo-dourado `#FFB800` (destaques, botão primário com texto `#111`),
  preto `#111111`, branco, cinzas `#F5F5F5` / `#737373` / `#1A1A1A`.
- **Tema:** botão de sol/lua no cabeçalho, menu do perfil e Configurações → Aparência
  (Claro, Escuro ou Sistema). A escolha fica salva no navegador. Na primeira visita, o
  sistema segue a aparência do sistema operacional. Um script em `index.html` aplica o
  tema antes da primeira pintura, para a tela não piscar.
- **Menu lateral recolhível**, com o estado lembrado entre as visitas.

### Logo

O sistema **não desenha nem substitui a marca**. Coloque os arquivos oficiais em
`public/brand/` (veja `public/brand/LEIA-ME.txt` e `src/brand/brand.ts`):

| Arquivo | Uso |
| --- | --- |
| `fesare-logo.png` | Logo original (obrigatório) |
| `fesare-logo-dark.png` | Versão oficial para fundo escuro (opcional; sem ela, a original aparece sobre uma base branca no tema escuro) |
| `fesare-logo-compact.png` | Versão compacta para o menu recolhido (opcional) |
| `fesare-favicon.png` | Ícone da aba (opcional) |

Enquanto o arquivo não existir, o menu mostra apenas o nome "Fesare" em texto.
Configurações → Logo da Fesare indica quais arquivos foram encontrados.
