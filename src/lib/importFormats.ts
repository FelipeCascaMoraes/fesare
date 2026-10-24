/**
 * Formatos aceitos na importação da base de conhecimento.
 *
 * Nesta etapa a importação faz apenas: seleção de arquivos, identificação do
 * formato e pré-visualização local (no navegador). NENHUM dado é gravado.
 * `processor: 'pendente'` indica que o processamento (ex.: leitura de planilhas,
 * extração de PDFs por IA no backend) ainda será implementado.
 */

export type ImportFormat = 'csv' | 'xlsx' | 'pdf' | 'json' | 'txt' | 'image' | 'docx' | 'unknown';
export type PreviewKind = 'table' | 'text' | 'pdf' | 'image' | 'none';

export interface FormatInfo {
  format: ImportFormat;
  label: string;
  preview: PreviewKind;
  /** Como o arquivo será processado futuramente. */
  futureProcessing: string;
}

const FORMATS: Record<ImportFormat, FormatInfo> = {
  csv: { format: 'csv', label: 'Planilha CSV', preview: 'table', futureProcessing: 'Mapeamento de colunas para os campos do catálogo.' },
  xlsx: { format: 'xlsx', label: 'Planilha Excel', preview: 'none', futureProcessing: 'Leitura das abas e mapeamento de colunas.' },
  pdf: { format: 'pdf', label: 'Documento PDF', preview: 'pdf', futureProcessing: 'Extração de tabelas e especificações por IA (no servidor).' },
  json: { format: 'json', label: 'Dados JSON', preview: 'text', futureProcessing: 'Validação do esquema e importação direta.' },
  txt: { format: 'txt', label: 'Texto', preview: 'text', futureProcessing: 'Leitura de especificações em texto livre.' },
  image: { format: 'image', label: 'Imagem', preview: 'image', futureProcessing: 'Associação a itens do catálogo (fotos e desenhos técnicos).' },
  docx: { format: 'docx', label: 'Documento Word', preview: 'none', futureProcessing: 'Extração de texto e tabelas.' },
  unknown: { format: 'unknown', label: 'Formato não suportado', preview: 'none', futureProcessing: '—' },
};

export const ACCEPTED_EXTENSIONS = '.csv,.xlsx,.xls,.pdf,.json,.txt,.docx,.png,.jpg,.jpeg,.webp';
export const MAX_FILE_BYTES = 25 * 1024 * 1024;

export function detectFormat(fileName: string): FormatInfo {
  const ext = fileName.toLowerCase().split('.').pop() ?? '';
  const map: Record<string, ImportFormat> = {
    csv: 'csv', xlsx: 'xlsx', xls: 'xlsx', pdf: 'pdf', json: 'json', txt: 'txt', docx: 'docx',
    png: 'image', jpg: 'image', jpeg: 'image', webp: 'image',
  };
  return FORMATS[map[ext] ?? 'unknown'];
}

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

/** Detecta o separador mais provável (; é comum em planilhas brasileiras). */
export function detectDelimiter(firstLine: string): string {
  const candidates = [';', ',', '\t'];
  return candidates.reduce((best, c) => (firstLine.split(c).length > firstLine.split(best).length ? c : best), ',');
}

/** Divide uma linha CSV respeitando aspas. */
export function splitCsvLine(line: string, delimiter: string): string[] {
  const out: string[] = [];
  let cur = '';
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (quoted && line[i + 1] === '"') { cur += '"'; i++; } else quoted = !quoted;
    } else if (ch === delimiter && !quoted) {
      out.push(cur.trim());
      cur = '';
    } else cur += ch;
  }
  out.push(cur.trim());
  return out;
}

export interface CsvPreview {
  headers: string[];
  rows: string[][];
  totalRows: number;
  delimiter: string;
}

/** Lê apenas as primeiras linhas para pré-visualização. */
export function previewCsv(text: string, maxRows = 10): CsvPreview {
  const lines = text.replace(/^﻿/, '').split(/\r?\n/).filter((l) => l.trim() !== '');
  if (lines.length === 0) return { headers: [], rows: [], totalRows: 0, delimiter: ',' };
  const delimiter = detectDelimiter(lines[0]);
  return {
    headers: splitCsvLine(lines[0], delimiter),
    rows: lines.slice(1, maxRows + 1).map((l) => splitCsvLine(l, delimiter)),
    totalRows: lines.length - 1,
    delimiter,
  };
}

/** Lê o arquivo como texto (com fallback para navegadores sem Blob.text). */
export function readFileText(file: Blob): Promise<string> {
  if (typeof file.text === 'function') return file.text();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}
