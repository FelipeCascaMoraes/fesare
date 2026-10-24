import { z } from 'zod';
import {
  CATALOG_CATEGORIES,
  PROJECT_STAGES,
  TASK_PRIORITIES,
  TASK_STATUSES,
} from './types';

/** Validação compartilhada dos formulários (reaproveitável no backend futuro). */

const optionalText = z
  .string()
  .trim()
  .max(500, 'Máximo de 500 caracteres')
  .optional()
  .transform((v) => (v ? v : undefined));

const optionalDate = z
  .string()
  .optional()
  .transform((v) => (v ? v : undefined))
  .refine((v) => !v || /^\d{4}-\d{2}-\d{2}$/.test(v), 'Data inválida');

export const clientSchema = z.object({
  name: z.string().trim().min(2, 'Informe o nome do cliente (mínimo 2 caracteres)').max(120),
  document: optionalText,
  email: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? v : undefined))
    .refine((v) => !v || z.string().email().safeParse(v).success, 'E-mail inválido'),
  phone: optionalText,
  city: optionalText,
  notes: optionalText,
});

export const projectSchema = z.object({
  name: z.string().trim().min(2, 'Informe o nome da obra').max(120),
  clientId: z.string().min(1, 'Selecione o cliente'),
  address: optionalText,
  stage: z.enum(PROJECT_STAGES),
  deadline: optionalDate,
  installationDate: optionalDate,
  responsibleId: optionalText,
  notes: optionalText,
});

export const taskSchema = z.object({
  title: z.string().trim().min(2, 'Informe o título da tarefa').max(160),
  description: optionalText,
  dueDate: optionalDate,
  priority: z.enum(TASK_PRIORITIES),
  status: z.enum(TASK_STATUSES),
  responsibleId: optionalText,
  projectId: optionalText,
});

export const catalogItemSchema = z.object({
  category: z.enum(CATALOG_CATEGORIES, { errorMap: () => ({ message: 'Selecione a categoria' }) }),
  name: z.string().trim().min(2, 'Informe o nome do item').max(160),
  code: optionalText,
  description: optionalText,
});

export const quoteItemSchema = z.object({
  productType: z.enum(['esquadrias_aluminio', 'portas_madeira', 'portoes']),
  model: z.string().trim().min(1, 'Informe o modelo'),
  widthMm: z.coerce.number({ invalid_type_error: 'Largura inválida' }).int('Use milímetros inteiros').min(100, 'Largura mínima: 100 mm').max(20000, 'Largura máxima: 20.000 mm'),
  heightMm: z.coerce.number({ invalid_type_error: 'Altura inválida' }).int('Use milímetros inteiros').min(100, 'Altura mínima: 100 mm').max(20000, 'Altura máxima: 20.000 mm'),
  quantity: z.coerce.number({ invalid_type_error: 'Quantidade inválida' }).int('Quantidade deve ser inteira').min(1, 'Quantidade mínima: 1').max(999),
  color: optionalText,
  notes: optionalText,
  unitPrice: z.coerce.number({ invalid_type_error: 'Valor inválido' }).min(0, 'O valor não pode ser negativo'),
});

export const quoteHeaderSchema = z.object({
  clientId: z.string().min(1, 'Selecione o cliente'),
  projectId: optionalText,
  discountType: z.enum(['percent', 'value']),
  discountValue: z.coerce.number().min(0, 'Desconto não pode ser negativo'),
  validUntil: optionalDate,
  notes: optionalText,
});

export const settingsSchema = z.object({
  companyName: z.string().trim().min(2, 'Informe o nome da empresa'),
  document: optionalText,
  phone: optionalText,
  email: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? v : undefined))
    .refine((v) => !v || z.string().email().safeParse(v).success, 'E-mail inválido'),
  address: optionalText,
  quoteValidityDays: z.coerce.number().int().min(1, 'Mínimo 1 dia').max(365, 'Máximo 365 dias'),
});

/** Converte um ZodError em { campo: mensagem }. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join('.');
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
