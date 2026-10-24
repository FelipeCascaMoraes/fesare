import { useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { useState } from 'react';
import type { z } from 'zod';
import { fieldErrors } from '@/domain/schemas';

interface FieldProps { label: string; error?: string; hint?: string; required?: boolean; className?: string }

function FieldShell({ id, label, error, hint, required, className = '', children }: FieldProps & { id: string; children: ReactNode }) {
  return (
    <div className={`field ${className}`}>
      <label htmlFor={id}>
        {label}
        {required && <span className="req" aria-hidden>*</span>}
      </label>
      {children}
      {error ? <span className="field-error" id={`${id}-err`}>{error}</span> : hint ? <span className="hint">{hint}</span> : null}
    </div>
  );
}

export function TextField({ label, error, hint, required, className, ...rest }: FieldProps & InputHTMLAttributes<HTMLInputElement>) {
  const id = useId();
  return (
    <FieldShell id={id} label={label} error={error} hint={hint} required={required} className={className}>
      <input id={id} className={`input ${error ? 'invalid' : ''}`} aria-invalid={!!error} aria-describedby={error ? `${id}-err` : undefined} {...rest} />
    </FieldShell>
  );
}

export function SelectField({ label, error, hint, required, className, children, ...rest }: FieldProps & SelectHTMLAttributes<HTMLSelectElement>) {
  const id = useId();
  return (
    <FieldShell id={id} label={label} error={error} hint={hint} required={required} className={className}>
      <select id={id} className={`select ${error ? 'invalid' : ''}`} aria-invalid={!!error} {...rest}>{children}</select>
    </FieldShell>
  );
}

export function TextAreaField({ label, error, hint, required, className, ...rest }: FieldProps & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const id = useId();
  return (
    <FieldShell id={id} label={label} error={error} hint={hint} required={required} className={className}>
      <textarea id={id} className={`textarea ${error ? 'invalid' : ''}`} aria-invalid={!!error} {...rest} />
    </FieldShell>
  );
}

/**
 * Estado simples de formulário com validação zod.
 * Mantém os valores como strings (como no DOM) e devolve os dados já tipados em `validate()`.
 */
export function useForm<S extends z.ZodTypeAny>(schema: S, initial: Record<string, string>) {
  const [values, setValues] = useState<Record<string, string>>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (name: string, value: string) => {
    setValues((v) => ({ ...v, [name]: value }));
    if (errors[name]) setErrors((e) => ({ ...e, [name]: '' }));
  };

  const bind = (name: string) => ({
    name,
    value: values[name] ?? '',
    error: errors[name] || undefined,
    onChange: (e: { target: { value: string } }) => set(name, e.target.value),
  });

  const validate = (): z.infer<S> | null => {
    const result = schema.safeParse(values);
    if (!result.success) {
      setErrors(fieldErrors(result.error));
      return null;
    }
    setErrors({});
    return result.data;
  };

  const reset = (next: Record<string, string>) => {
    setValues(next);
    setErrors({});
  };

  return { values, errors, set, bind, validate, reset, setErrors };
}

/** Preenche os valores do formulário (strings) a partir de uma entidade existente. */
export function toFormValues<T extends Record<string, string>>(blank: T, entity?: object): T {
  if (!entity) return { ...blank };
  const out: Record<string, string> = { ...blank };
  for (const key of Object.keys(blank)) {
    const v = (entity as Record<string, unknown>)[key];
    out[key] = v === undefined || v === null ? '' : String(v);
  }
  return out as T;
}
