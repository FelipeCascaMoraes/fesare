import { clientSchema, fieldErrors, quoteItemSchema } from './schemas';

describe('validação', () => {
  it('exige nome do cliente e valida e-mail', () => {
    const r = clientSchema.safeParse({ name: 'A', email: 'invalido' });
    expect(r.success).toBe(false);
    if (!r.success) {
      const e = fieldErrors(r.error);
      expect(e.name).toMatch(/nome/i);
      expect(e.email).toBe('E-mail inválido');
    }
  });

  it('converte campos vazios em undefined', () => {
    const r = clientSchema.parse({ name: 'Maria', email: '', phone: '' });
    expect(r).toEqual({ name: 'Maria', email: undefined, phone: undefined, document: undefined, city: undefined, notes: undefined });
  });

  it('valida medidas e quantidade dos itens', () => {
    const r = quoteItemSchema.safeParse({ productType: 'portoes', model: 'X', widthMm: '50', heightMm: '2000', quantity: '0', unitPrice: '-1' });
    expect(r.success).toBe(false);
    if (!r.success) {
      const e = fieldErrors(r.error);
      expect(e.widthMm).toMatch(/mínima/);
      expect(e.quantity).toMatch(/mínima/);
      expect(e.unitPrice).toMatch(/negativo/);
    }
  });

  it('aceita item válido vindo do formulário (strings)', () => {
    const r = quoteItemSchema.parse({ productType: 'portoes', model: 'Basculante', widthMm: '3000', heightMm: '2200', quantity: '2', unitPrice: '10.5', color: '' });
    expect(r.widthMm).toBe(3000);
    expect(r.unitPrice).toBe(10.5);
    expect(r.color).toBeUndefined();
  });
});
