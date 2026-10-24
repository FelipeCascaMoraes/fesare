/**
 * DADOS DEMONSTRATIVOS
 * ---------------------------------------------------------------
 * Tudo neste arquivo é fictício e serve apenas para visualizar a interface.
 * Todos os registros têm `isDemo: true` e ids com prefixo "demo-",
 * e podem ser removidos em Configurações → Dados demonstrativos.
 * Os valores em R$ NÃO são preços reais da Fesare.
 */
import type { Collections } from '../dataSource';
import type { BaseEntity, CatalogCategory, CatalogItem } from '@/domain/types';
import { addDays, toISODate } from '@/domain/dates';

export function buildDemoData(base: Date): Collections {
  const today = toISODate(base);
  const d = (offset: number) => addDays(today, offset);
  const ts = (offsetDays: number, hours = 0) => {
    const t = new Date(base);
    t.setDate(t.getDate() + offsetDays);
    t.setHours(t.getHours() - hours);
    return t.toISOString();
  };
  const meta = (id: string, createdOffset = -10): BaseEntity => ({
    id,
    createdAt: ts(createdOffset),
    updatedAt: ts(createdOffset),
    isDemo: true,
  });

  const team = [
    { ...meta('demo-u1', -60), name: 'Carla Menezes', role: 'Comercial' },
    { ...meta('demo-u2', -60), name: 'Rafael Duarte', role: 'Produção' },
    { ...meta('demo-u3', -60), name: 'Bruno Teixeira', role: 'Instalação' },
  ];

  const clients = [
    { ...meta('demo-c1', -40), name: 'Construtora Horizonte (exemplo)', document: '00.000.000/0001-00', email: 'contato@exemplo.com', phone: '(11) 90000-0001', city: 'São Paulo' },
    { ...meta('demo-c2', -30), name: 'Mariana Alves (exemplo)', email: 'mariana@exemplo.com', phone: '(11) 90000-0002', city: 'Campinas' },
    { ...meta('demo-c3', -25), name: 'Residencial Vila Verde (exemplo)', phone: '(11) 90000-0003', city: 'Jundiaí' },
    { ...meta('demo-c4', -12), name: 'Paulo Souza (exemplo)', email: 'paulo@exemplo.com', city: 'Valinhos' },
  ];

  const projects: Collections['projects'] = [
    { ...meta('demo-p1', -20), name: 'Casa Alphaville — fachada', clientId: 'demo-c2', stage: 'novo_orcamento', deadline: d(30), responsibleId: 'demo-u1', address: 'Rua Exemplo, 100' },
    { ...meta('demo-p2', -18), name: 'Edifício Horizonte — bloco A', clientId: 'demo-c1', stage: 'aguardando_aprovacao', deadline: d(45), responsibleId: 'demo-u1' },
    { ...meta('demo-p3', -15), name: 'Sobrado Valinhos', clientId: 'demo-c4', stage: 'aprovado', deadline: d(25), responsibleId: 'demo-u2' },
    { ...meta('demo-p4', -14), name: 'Vila Verde — portões', clientId: 'demo-c3', stage: 'em_producao', deadline: d(12), responsibleId: 'demo-u2' },
    { ...meta('demo-p5', -30), name: 'Edifício Horizonte — áreas comuns', clientId: 'demo-c1', stage: 'pronto_instalacao', deadline: d(6), responsibleId: 'demo-u3' },
    { ...meta('demo-p6', -35), name: 'Apartamento 52 — janelas', clientId: 'demo-c2', stage: 'instalacao_agendada', deadline: d(4), installationDate: d(3), responsibleId: 'demo-u3' },
    { ...meta('demo-p7', -50), name: 'Casa de campo — portas', clientId: 'demo-c4', stage: 'concluido', deadline: d(-5), installationDate: d(-6), responsibleId: 'demo-u3' },
  ];

  const quotes: Collections['quotes'] = [
    {
      ...meta('demo-q1', -3), number: 'ORC-DEMO-0001', clientId: 'demo-c2', projectId: 'demo-p1', status: 'rascunho',
      discountType: 'percent', discountValue: 0, validUntil: d(12),
      items: [
        { id: 'demo-qi1', productType: 'esquadrias_aluminio', model: 'Janela de correr 2 folhas (exemplo)', widthMm: 1500, heightMm: 1200, quantity: 3, color: 'Branco (exemplo)', unitPrice: 1000 },
        { id: 'demo-qi2', productType: 'portas_madeira', model: 'Porta pivotante (exemplo)', widthMm: 1100, heightMm: 2400, quantity: 1, color: 'Natural (exemplo)', unitPrice: 2000 },
      ],
    },
    {
      ...meta('demo-q2', -6), number: 'ORC-DEMO-0002', clientId: 'demo-c1', projectId: 'demo-p2', status: 'aguardando_aprovacao',
      discountType: 'percent', discountValue: 5, validUntil: d(9),
      items: [
        { id: 'demo-qi3', productType: 'esquadrias_aluminio', model: 'Maxim-ar (exemplo)', widthMm: 600, heightMm: 600, quantity: 12, color: 'Preto (exemplo)', unitPrice: 500 },
      ],
    },
    {
      ...meta('demo-q3', -9), number: 'ORC-DEMO-0003', clientId: 'demo-c3', projectId: 'demo-p4', status: 'aprovado',
      discountType: 'value', discountValue: 100, validUntil: d(-1),
      items: [
        { id: 'demo-qi4', productType: 'portoes', model: 'Portão basculante (exemplo)', widthMm: 3000, heightMm: 2200, quantity: 2, color: 'Grafite (exemplo)', unitPrice: 3000 },
      ],
    },
    {
      ...meta('demo-q4', -2), number: 'ORC-DEMO-0004', clientId: 'demo-c4', status: 'aguardando_aprovacao',
      discountType: 'percent', discountValue: 0,
      items: [
        { id: 'demo-qi5', productType: 'esquadrias_aluminio', model: 'Porta de correr 4 folhas (exemplo)', widthMm: 3000, heightMm: 2200, quantity: 1, unitPrice: 4000 },
      ],
    },
  ];

  const tasks: Collections['tasks'] = [
    { ...meta('demo-t1', -2), title: 'Medir vãos da fachada', dueDate: d(1), priority: 'alta', status: 'pendente', responsibleId: 'demo-u1', projectId: 'demo-p1' },
    { ...meta('demo-t2', -4), title: 'Enviar orçamento revisado', dueDate: d(2), priority: 'media', status: 'em_andamento', responsibleId: 'demo-u1', projectId: 'demo-p2' },
    { ...meta('demo-t3', -5), title: 'Conferir perfis em estoque', dueDate: d(-1), priority: 'alta', status: 'pendente', responsibleId: 'demo-u2', projectId: 'demo-p4' },
    { ...meta('demo-t4', -1), title: 'Confirmar horário da instalação', dueDate: d(2), priority: 'media', status: 'pendente', responsibleId: 'demo-u3', projectId: 'demo-p6' },
    { ...meta('demo-t5', -8), title: 'Registrar fotos da obra concluída', dueDate: d(-4), priority: 'baixa', status: 'concluida', responsibleId: 'demo-u3', projectId: 'demo-p7' },
  ];

  const cat = (id: string, category: CatalogCategory, name: string, code?: string): CatalogItem => ({
    ...meta(id, -60), category, name, code, status: 'ativo', description: 'Registro demonstrativo — será substituído pela base de conhecimento real.',
  });
  const catalog: CatalogItem[] = [
    cat('demo-k1', 'esquadrias_aluminio', 'Janela de correr 2 folhas (exemplo)', 'EX-JC2'),
    cat('demo-k2', 'esquadrias_aluminio', 'Maxim-ar (exemplo)', 'EX-MA'),
    cat('demo-k3', 'esquadrias_aluminio', 'Porta de correr 4 folhas (exemplo)', 'EX-PC4'),
    cat('demo-k4', 'portas_madeira', 'Porta pivotante (exemplo)', 'EX-PP'),
    cat('demo-k5', 'portas_madeira', 'Porta de giro lisa (exemplo)', 'EX-PG'),
    cat('demo-k6', 'portoes', 'Portão basculante (exemplo)', 'EX-PB'),
    cat('demo-k7', 'portoes', 'Portão deslizante (exemplo)', 'EX-PD'),
    cat('demo-k8', 'linhas', 'Linha residencial (exemplo)'),
    cat('demo-k9', 'perfis', 'Perfil de marco (exemplo)', 'EX-PM'),
    cat('demo-k10', 'cores', 'Branco (exemplo)'),
    cat('demo-k11', 'cores', 'Preto (exemplo)'),
    cat('demo-k12', 'cores', 'Grafite (exemplo)'),
    cat('demo-k13', 'vidros', 'Vidro temperado incolor (exemplo)'),
    cat('demo-k14', 'acessorios', 'Fechadura (exemplo)'),
  ];

  const activities: Collections['activities'] = [
    { ...meta('demo-a1'), createdAt: ts(0, 2), kind: 'quote', message: 'Orçamento ORC-DEMO-0004 enviado para aprovação', entityId: 'demo-q4' },
    { ...meta('demo-a2'), createdAt: ts(0, 5), kind: 'project', message: 'Obra "Apartamento 52 — janelas" movida para Instalação agendada', entityId: 'demo-p6' },
    { ...meta('demo-a3'), createdAt: ts(-1, 1), kind: 'task', message: 'Tarefa "Registrar fotos da obra concluída" concluída', entityId: 'demo-t5' },
    { ...meta('demo-a4'), createdAt: ts(-2, 3), kind: 'client', message: 'Cliente "Paulo Souza (exemplo)" cadastrado', entityId: 'demo-c4' },
    { ...meta('demo-a5'), createdAt: ts(-3, 0), kind: 'project', message: 'Obra "Vila Verde — portões" entrou em produção', entityId: 'demo-p4' },
  ];

  return { team, clients, projects, quotes, tasks, catalog, activities };
}
