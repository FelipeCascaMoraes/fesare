import { useData } from '@/data/DataContext';
import { Button } from '@/components/ui';
import { Modal } from '@/components/Modal';
import { SelectField, TextAreaField, TextField, toFormValues, useForm } from '@/components/forms';
import { quoteItemSchema } from '@/domain/schemas';
import { PRODUCT_TYPE_LABELS } from '@/domain/labels';
import type { ProductType, QuoteItem } from '@/domain/types';
import { newId } from '@/lib/id';

const blank = { productType: 'esquadrias_aluminio', model: '', widthMm: '', heightMm: '', quantity: '1', color: '', notes: '', unitPrice: '' };

/** Montado apenas quando aberto. Não grava nada: devolve o item ao editor. */
export function QuoteItemForm({ item, onClose, onSubmit }: {
  item?: QuoteItem;
  onClose: () => void;
  onSubmit: (item: QuoteItem) => void;
}) {
  const { catalog } = useData();
  const form = useForm(quoteItemSchema, toFormValues(blank, item));
  const type = form.values.productType as ProductType;
  const models = catalog.filter((c) => c.category === type && c.status === 'ativo');
  const colors = catalog.filter((c) => c.category === 'cores' && c.status === 'ativo');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = form.validate();
    if (!data) return;
    onSubmit({ ...data, id: item?.id ?? newId() });
    onClose();
  };

  return (
    <Modal
      open
      onClose={onClose}
      size="lg"
      title={item ? 'Editar item' : 'Adicionar item'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button type="submit" form="quote-item-form">{item ? 'Atualizar item' : 'Adicionar item'}</Button>
        </>
      }
    >
      <form id="quote-item-form" className="form-grid" onSubmit={submit} noValidate>
        <SelectField label="Tipo" required {...form.bind('productType')}>
          {(Object.keys(PRODUCT_TYPE_LABELS) as ProductType[]).map((t) => <option key={t} value={t}>{PRODUCT_TYPE_LABELS[t]}</option>)}
        </SelectField>
        <TextField
          label="Modelo"
          required
          list="quote-models"
          placeholder="Digite ou escolha do catálogo"
          hint={models.length ? `${models.length} modelo(s) no catálogo para este tipo` : 'Nenhum modelo no catálogo para este tipo'}
          {...form.bind('model')}
        />
        <datalist id="quote-models">{models.map((m) => <option key={m.id} value={m.name} />)}</datalist>
        <TextField label="Largura (mm)" required type="number" inputMode="numeric" min={100} {...form.bind('widthMm')} />
        <TextField label="Altura (mm)" required type="number" inputMode="numeric" min={100} {...form.bind('heightMm')} />
        <TextField label="Quantidade" required type="number" inputMode="numeric" min={1} {...form.bind('quantity')} />
        <TextField label="Cor / acabamento" list="quote-colors" {...form.bind('color')} />
        <datalist id="quote-colors">{colors.map((c) => <option key={c.id} value={c.name} />)}</datalist>
        <TextField
          label="Valor unitário (R$)"
          required
          type="number"
          step="0.01"
          min={0}
          className="span-2"
          hint="Informado manualmente. O cálculo automático será integrado quando as regras comerciais forem definidas."
          {...form.bind('unitPrice')}
        />
        <TextAreaField label="Observações" className="span-2" {...form.bind('notes')} />
      </form>
    </Modal>
  );
}
