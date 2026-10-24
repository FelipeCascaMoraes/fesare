import { useState } from 'react';
import { Database, FlaskConical, Image as ImageIcon, Laptop, Moon, RotateCcw, Save, Sun, Trash2 } from 'lucide-react';
import { useData } from '@/data/DataContext';
import { Badge, Button, Card, PageHeader } from '@/components/ui';
import { ConfirmDialog } from '@/components/Modal';
import { TextField, toFormValues, useForm } from '@/components/forms';
import { useToast } from '@/components/Toast';
import { settingsSchema } from '@/domain/schemas';
import { useTheme, type ThemePreference } from '@/theme/ThemeContext';
import { BRAND } from '@/brand/brand';
import { BrandLogo, useImageStatus } from '@/brand/BrandLogo';

const blank = { companyName: '', document: '', phone: '', email: '', address: '', quoteValidityDays: '15' };

const THEMES: { value: ThemePreference; label: string; icon: typeof Sun }[] = [
  { value: 'light', label: 'Claro', icon: Sun },
  { value: 'dark', label: 'Escuro', icon: Moon },
  { value: 'system', label: 'Sistema', icon: Laptop },
];

function AssetStatus({ label, src, optional }: { label: string; src: string; optional?: boolean }) {
  const status = useImageStatus(src);
  return (
    <li>
      <span>
        <span className="cell-main">{label}</span>
        <div className="cell-sub"><code>public{src}</code></div>
      </span>
      {status === 'loading' ? (
        <Badge tone="muted">Verificando…</Badge>
      ) : status === 'ok' ? (
        <Badge tone="success" dot>Encontrado</Badge>
      ) : (
        <Badge tone={optional ? 'muted' : 'warning'} dot>{optional ? 'Não enviado (opcional)' : 'Não encontrado'}</Badge>
      )}
    </li>
  );
}

export function Settings() {
  const data = useData();
  const { settings, saveSettings, clearDemoData, restoreDemoData, team } = data;
  const { preference, setPreference } = useTheme();
  const toast = useToast();
  const form = useForm(settingsSchema, toFormValues(blank, settings));
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState<'clear' | 'restore' | null>(null);

  const collections = [data.clients, data.projects, data.quotes, data.tasks, data.catalog, data.team, data.activities];
  const demoCount = collections.reduce((n, l) => n + l.filter((x) => x.isDemo).length, 0);
  const realCount = collections.reduce((n, l) => n + l.filter((x) => !x.isDemo).length, 0);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const values = form.validate();
    if (!values) return;
    setBusy(true);
    try {
      await saveSettings(values);
      toast.success('Configurações salvas.');
    } catch (err) {
      toast.error(err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="page">
      <PageHeader title="Configurações" subtitle="Aparência, dados da empresa, marca e gerenciamento dos dados demonstrativos." />

      <div className="grid grid-2">
        <div className="stack">
          <Card title="Aparência" subtitle="A escolha fica salva neste navegador.">
            <div className="theme-options" role="radiogroup" aria-label="Tema">
              {THEMES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  role="radio"
                  aria-checked={preference === t.value}
                  className={`theme-option ${preference === t.value ? 'active' : ''}`}
                  onClick={() => setPreference(t.value)}
                >
                  <t.icon />
                  {t.label}
                </button>
              ))}
            </div>
          </Card>

          <Card title="Dados da empresa" subtitle="Usados no cabeçalho dos orçamentos.">
            <form className="form-grid" onSubmit={submit} noValidate>
              <TextField label="Nome da empresa" required className="span-2" {...form.bind('companyName')} />
              <TextField label="CNPJ" {...form.bind('document')} />
              <TextField label="Telefone" {...form.bind('phone')} />
              <TextField label="E-mail" type="email" {...form.bind('email')} />
              <TextField label="Validade padrão do orçamento (dias)" type="number" min={1} {...form.bind('quoteValidityDays')} />
              <TextField label="Endereço" className="span-2" {...form.bind('address')} />
              <div className="span-2"><Button type="submit" icon={Save} loading={busy}>Salvar configurações</Button></div>
            </form>
          </Card>
        </div>

        <div className="stack">
          <Card title="Logo da Fesare" actions={<ImageIcon size={18} className="muted" />}>
            <div className="logo-preview"><BrandLogo /></div>
            <p className="small muted mt-3">
              O sistema usa somente os arquivos oficiais. Envie-os para a pasta <code>public/brand/</code> com os nomes abaixo.
            </p>
            <ul className="list-plain mt-2">
              <AssetStatus label="Logo original" src={BRAND.assets.logo} />
              <AssetStatus label="Versão para fundo escuro" src={BRAND.assets.logoDark} optional />
              <AssetStatus label="Versão compacta (menu recolhido)" src={BRAND.assets.logoCompact} optional />
            </ul>
          </Card>

          <Card title="Dados demonstrativos" actions={<FlaskConical size={18} className="muted" />}>
            <p className="muted small">
              Registros fictícios para visualizar o sistema. Eles ficam separados dos seus registros reais e podem ser
              removidos sem afetar o que você cadastrou.
            </p>
            <div className="kpi-pair mt-4">
              <div><div className="stat-value">{demoCount}</div><div className="small muted">demonstrativos</div></div>
              <div><div className="stat-value">{realCount}</div><div className="small muted">reais</div></div>
            </div>
            <div className="row wrap mt-4">
              <Button variant="secondary" icon={Trash2} disabled={demoCount === 0} onClick={() => setConfirm('clear')}>Remover dados demonstrativos</Button>
              <Button variant="ghost" icon={RotateCcw} onClick={() => setConfirm('restore')}>Recarregar demonstração</Button>
            </div>
          </Card>

          <Card title="Armazenamento" actions={<Database size={18} className="muted" />}>
            <p className="small muted">
              Nesta versão os dados ficam salvos <strong>apenas neste navegador</strong>. A estrutura do banco
              PostgreSQL já está definida (<code>database/schema.sql</code>) para a migração ao servidor.
            </p>
            <div className="mt-3"><Badge tone="warning" dot>Armazenamento local</Badge></div>
          </Card>

          <Card title="Equipe" subtitle="Responsáveis disponíveis em obras e tarefas.">
            {team.length === 0 ? (
              <p className="small muted">Nenhum membro cadastrado. O cadastro de usuários chegará com a autenticação.</p>
            ) : (
              <ul className="list-plain">
                {team.map((m) => <li key={m.id}><span className="cell-main">{m.name}</span><span className="small muted">{m.role}{m.isDemo ? ' · demo' : ''}</span></li>)}
              </ul>
            )}
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={confirm === 'clear'}
        onClose={() => setConfirm(null)}
        title="Remover dados demonstrativos"
        message={`Serão removidos ${demoCount} registros demonstrativos. Os ${realCount} registros reais serão mantidos.`}
        confirmLabel="Remover"
        onConfirm={async () => { await clearDemoData(); toast.success('Dados demonstrativos removidos.'); }}
      />
      <ConfirmDialog
        open={confirm === 'restore'}
        onClose={() => setConfirm(null)}
        title="Recarregar demonstração"
        danger={false}
        message="Os registros demonstrativos serão recriados no estado original. Seus registros reais não serão alterados."
        confirmLabel="Recarregar"
        onConfirm={async () => { await restoreDemoData(); toast.success('Demonstração recarregada.'); }}
      />
    </div>
  );
}
