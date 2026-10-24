import { useMemo, useState } from 'react';
import { Pencil, Plus, Search, Trash2, Users } from 'lucide-react';
import { useData } from '@/data/DataContext';
import { Button, Card, DemoTag, EmptyState, IconButton, PageHeader } from '@/components/ui';
import { ConfirmDialog, Modal } from '@/components/Modal';
import { TextAreaField, TextField, toFormValues, useForm } from '@/components/forms';
import { useToast } from '@/components/Toast';
import { clientSchema } from '@/domain/schemas';
import type { Client } from '@/domain/types';

const blank = { name: '', document: '', email: '', phone: '', city: '', notes: '' };

/** Montado apenas quando aberto, para sempre começar com os valores atuais. */
export function ClientForm({ onClose, client, onSaved }: {
  onClose: () => void;
  client?: Client;
  onSaved?: (c: Client) => void;
}) {
  const { saveClient } = useData();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const form = useForm(clientSchema, toFormValues(blank, client));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = form.validate();
    if (!data) return;
    setBusy(true);
    try {
      const saved = await saveClient({ ...data, isDemo: client?.isDemo }, client?.id);
      toast.success(client ? 'Cliente atualizado.' : 'Cliente cadastrado.');
      onSaved?.(saved);
      onClose();
    } catch (err) {
      toast.error(err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={client ? 'Editar cliente' : 'Novo cliente'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button type="submit" form="client-form" loading={busy}>Salvar cliente</Button>
        </>
      }
    >
      <form id="client-form" className="form-grid" onSubmit={submit} noValidate>
        <TextField label="Nome / razão social" required className="span-2" {...form.bind('name')} />
        <TextField label="CPF / CNPJ" {...form.bind('document')} />
        <TextField label="Telefone" {...form.bind('phone')} />
        <TextField label="E-mail" type="email" {...form.bind('email')} />
        <TextField label="Cidade" {...form.bind('city')} />
        <TextAreaField label="Observações" className="span-2" {...form.bind('notes')} />
      </form>
    </Modal>
  );
}

export function Clients() {
  const { clients, projects, quotes, removeClient } = useData();
  const toast = useToast();
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState<Client | undefined>();
  const [formOpen, setFormOpen] = useState(false);
  const [deleting, setDeleting] = useState<Client | undefined>();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return [...clients]
      .filter((c) => !q || [c.name, c.email, c.city, c.document].some((v) => v?.toLowerCase().includes(q)))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [clients, query]);

  const openNew = () => { setEditing(undefined); setFormOpen(true); };

  return (
    <div className="page">
      <PageHeader
        title="Clientes"
        subtitle="Cadastro de clientes vinculados a obras e orçamentos."
        actions={<Button icon={Plus} onClick={openNew}>Novo cliente</Button>}
      />

      <div className="toolbar">
        <div className="search">
          <Search />
          <input className="input" placeholder="Buscar por nome, e-mail, cidade ou documento" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Buscar clientes" />
        </div>
        <span className="small muted">{filtered.length} de {clients.length}</span>
      </div>

      <Card>
        {clients.length === 0 ? (
          <EmptyState icon={Users} title="Nenhum cliente cadastrado" description="Cadastre o primeiro cliente para criar obras e orçamentos." action={<Button icon={Plus} onClick={openNew}>Cadastrar cliente</Button>} />
        ) : filtered.length === 0 ? (
          <EmptyState icon={Search} title="Nenhum resultado" description={`Nenhum cliente corresponde a "${query}".`} />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr><th>Cliente</th><th>Contato</th><th>Cidade</th><th className="num">Obras</th><th className="num">Orçamentos</th><th /></tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id}>
                    <td><div className="cell-main">{c.name} <DemoTag show={c.isDemo} /></div><div className="cell-sub">{c.document || '—'}</div></td>
                    <td><div>{c.email || '—'}</div><div className="cell-sub">{c.phone}</div></td>
                    <td>{c.city || '—'}</td>
                    <td className="num">{projects.filter((p) => p.clientId === c.id).length}</td>
                    <td className="num">{quotes.filter((q) => q.clientId === c.id).length}</td>
                    <td className="actions">
                      <IconButton icon={Pencil} label={`Editar ${c.name}`} onClick={() => { setEditing(c); setFormOpen(true); }} />
                      <IconButton icon={Trash2} label={`Excluir ${c.name}`} danger onClick={() => setDeleting(c)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {formOpen && <ClientForm onClose={() => setFormOpen(false)} client={editing} />}
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(undefined)}
        title="Excluir cliente"
        message={<>Tem certeza que deseja excluir <strong>{deleting?.name}</strong>? Esta ação não pode ser desfeita.</>}
        confirmLabel="Excluir"
        onConfirm={async () => {
          await removeClient(deleting!.id);
          toast.success('Cliente excluído.');
        }}
      />
    </div>
  );
}
