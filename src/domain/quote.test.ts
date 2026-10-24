import { computeTotals, itemAreaM2, nextQuoteNumber } from './quote';

describe('computeTotals', () => {
  const items = [
    { unitPrice: 100, quantity: 3 },
    { unitPrice: 49.99, quantity: 2 },
  ];

  it('soma os itens', () => {
    expect(computeTotals(items, 'percent', 0)).toEqual({ subtotal: 399.98, discount: 0, total: 399.98 });
  });

  it('aplica desconto percentual', () => {
    expect(computeTotals([{ unitPrice: 200, quantity: 1 }], 'percent', 10)).toEqual({ subtotal: 200, discount: 20, total: 180 });
  });

  it('aplica desconto em valor', () => {
    expect(computeTotals([{ unitPrice: 200, quantity: 1 }], 'value', 50).total).toBe(150);
  });

  it('nunca deixa o total negativo', () => {
    expect(computeTotals([{ unitPrice: 100, quantity: 1 }], 'value', 500)).toEqual({ subtotal: 100, discount: 100, total: 0 });
    expect(computeTotals([{ unitPrice: 100, quantity: 1 }], 'percent', 150).total).toBe(0);
  });

  it('lida com orçamento vazio', () => {
    expect(computeTotals([], 'percent', 10)).toEqual({ subtotal: 0, discount: 0, total: 0 });
  });
});

describe('itemAreaM2', () => {
  it('calcula a área total em m²', () => {
    expect(itemAreaM2({ widthMm: 1500, heightMm: 1200, quantity: 2 })).toBe(3.6);
  });
});

describe('nextQuoteNumber', () => {
  it('incrementa dentro do ano e ignora outros formatos', () => {
    expect(nextQuoteNumber([], 2026)).toBe('ORC-2026-0001');
    expect(nextQuoteNumber(['ORC-2026-0007', 'ORC-2025-0099', 'ORC-DEMO-0001'], 2026)).toBe('ORC-2026-0008');
  });
});
