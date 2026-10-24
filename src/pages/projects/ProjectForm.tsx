import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useData } from '@/data/DataContext';
import { Button } from '@/components/ui';
import { Modal } from '@/components/Modal';
import { SelectField, TextAreaField, TextField, toFormValues, useForm } from '@/components/forms';
import { useToast } from '@/components/Toast';
import { projectSchema } from '@/domain/schemas';
import { STAGE_LABELS } from '@/domain/labels';
import { PROJECT_STAGES, type Project, type ProjectStage } from '@/domain/types';

const blank = { name: '', clientId: '', address: '', stage: 'novo_orcamento', deadline: '', installationDate: '', responsibleId: '', notes: '' };

/** Montado apenas quando aberto. */
export function ProjectForm({ project, initialStage, onClose, onSaved }: {
  project?: Project;
  initialStage?: ProjectStage;
  onClose: () => void;
  onSaved?: (p: Project) => void;
}) {
  const { clients, team, saveProject } = useData();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const form = useForm(projectSchema, toFormValues({ ...blank, stage: initialStage ?? blank.stage }, project));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = form.validate();
    if (!data) return;
    if (data.installationDate && data.deadline && data.installationDate > data.deadline) {
      form.setErrors({ installationDate: 'A instalação está depois do prazo da obra' });
      return;
    }
    setBusy(true);
    try {
      const saved = await saveProject({ ...data, isDemo: project?.isDemo }, project?.id);
      toast.success(project ? 'Obra atualizada.' : 'Obra criada.');
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
      title={project ? 'Editar obra' : 'Nova obra'}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button type="submit" form="project-form" loading={busy}>Salvar obra</Button>
        </>
      }
    >
      <form id="project-form" className="form-grid" onSubmit={submit} noValidate>
        <TextField label="Nome da obra" required className="span-2" placeholder="Ex.: Residência Silva — janelas" {...form.bind('name')} />
        <SelectField label="Cliente" required {...form.bind('clientId')}>
          <option value="">Selecione…</option>
          {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </SelectField>
        <SelectField label="Etapa" {...form.bind('stage')}>
          {PROJECT_STAGES.map((s) => <option key={s} value={s}>{STAGE_LABELS[s]}</option>)}
        </SelectField>
        <TextField label="Prazo de entrega" type="date" {...form.bind('deadline')} />
        <TextField label="Data de instalação" type="date" {...form.bind('installationDate')} />
        <SelectField label="Responsável" {...form.bind('responsibleId')}>
          <option value="">Sem responsável</option>
          {team.map((m) => <option key={m.id} value={m.id}>{m.name} — {m.role}</option>)}
        </SelectField>
        <TextField label="Endereço" {...form.bind('address')} />
        <TextAreaField label="Observações" className="span-2" {...form.bind('notes')} />
        {clients.length === 0 && (
          <p className="span-2 field-error">
            Nenhum cliente cadastrado. <Link to="/clientes" className="link">Cadastre um cliente</Link> antes de criar a obra.
          </p>
        )}
      </form>
    </Modal>
  );
}
