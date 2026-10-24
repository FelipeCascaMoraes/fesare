import type { DiscountType, Quote, QuoteItem } from './types';

/**
 * Aritmética simples do orçamento (soma de itens e desconto).
 * NÃO é o motor de cálculo de preços: os valores unitários vêm de fora
 * (hoje, digitados manualmente). O motor de cálculo será plugado aqui depois
 * que as regras comerciais forem fornecidas.
 */

export const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

export function itemTotal(item: Pick<QuoteItem, 'unitPrice' | 'quantity'>): number {
  return round2(item.unitPrice * item.quantity);
}

export function itemAreaM2(item: Pick<QuoteItem, 'widthMm' | 'heightMm' | 'quantity'>): number {
  return round2((item.widthMm / 1000) * (item.heightMm / 1000) * item.quantity);
}

export interface QuoteTotals {
  subtotal: number;
  discount: number;
  total: number;
}

export function computeTotals(
  items: Pick<QuoteItem, 'unitPrice' | 'quantity'>[],
  discountType: DiscountType,
  discountValue: number,
): QuoteTotals {
  const subtotal = round2(items.reduce((sum, i) => sum + itemTotal(i), 0));
  const raw = discountType === 'percent' ? (subtotal * Math.min(Math.max(discountValue, 0), 100)) / 100 : discountValue;
  const discount = round2(Math.min(Math.max(raw, 0), subtotal));
  return { subtotal, discount, total: round2(subtotal - discount) };
}

export const quoteTotals = (q: Pick<Quote, 'items' | 'discountType' | 'discountValue'>) =>
  computeTotals(q.items, q.discountType, q.discountValue);

export function nextQuoteNumber(existing: string[], year = new Date().getFullYear()): string {
  const prefix = `ORC-${year}-`;
  const max = existing
    .filter((n) => n.startsWith(prefix))
    .map((n) => parseInt(n.slice(prefix.length), 10))
    .filter((n) => !Number.isNaN(n))
    .reduce((a, b) => Math.max(a, b), 0);
  return `${prefix}${String(max + 1).padStart(4, '0')}`;
}
