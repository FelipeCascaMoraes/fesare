import { useEffect, useRef, useState } from 'react';
import { FileUp, Trash2 } from 'lucide-react';
import { Banner, Button, IconButton } from '@/components/ui';
import { Modal } from '@/components/Modal';
import { CATEGORY_LABELS } from '@/domain/labels';
import { CATALOG_CATEGORIES, type CatalogCategory } from '@/domain/types';
import {
  ACCEPTED_EXTENSIONS,
  type CsvPreview,
  detectFormat,
  formatBytes,
  type FormatInfo,
  MAX_FILE_BYTES,
  previewCsv,
  readFileText,
} from '@/lib/importFormats';

interface SelectedFile {
  id: string;
  file: File;
  info: FormatInfo;
  error?: string;
  csv?: CsvPreview;
  text?: string;
  url?: string;
}

async function buildPreview(file: File, id: string): Promise<SelectedFile> {
  const info = detectFormat(file.name);
  const item: SelectedFile = { id, file, info };
  if (info.format === 'unknown') return { ...item, error: 'Formato não suportado.' };
  if (file.size > MAX_FILE_BYTES) return { ...item, error: `Arquivo maior que ${formatBytes(MAX_FILE_BYTES)}.` };
  try {
    if (info.preview === 'table') item.csv = previewCsv(await readFileText(file));
    else if (info.preview === 'text') item.text = (await readFileText(file)).slice(0, 3000);
    else if (info.preview === 'image' || info.preview === 'pdf') item.url = URL.createObjectURL(file);
  } catch {
    item.error = 'Não foi possível ler o arquivo para pré-visualização.';
  }
  return item;
}

function Preview({ f }: { f: SelectedFile }) {
  if (f.error) return <p className="field-error mt-2">{f.error}</p>;
  if (f.csv) {
    if (f.csv.headers.length === 0) return <p className="small muted mt-2">Arquivo vazio.</p>;
    return (
      <>
        <p className="small muted mt-2">
          {f.csv.totalRows} linha(s) de dados · {f.csv.headers.length} coluna(s) · separador “{f.csv.delimiter === '\t' ? 'tab' : f.csv.delimiter}”
          {f.csv.totalRows > f.csv.rows.length && ` · mostrando as primeiras ${f.csv.rows.length}`}
        </p>
        <div className="preview-box">
          <table>
            <thead><tr>{f.csv.headers.map((h, i) => <th key={i}>{h || `Coluna ${i + 1}`}</th>)}</tr></thead>
            <tbody>{f.csv.rows.map((r, i) => <tr key={i}>{f.csv!.headers.map((_, j) => <td key={j}>{r[j] ?? ''}</td>)}</tr>)}</tbody>
          </table>
        </div>
      </>
    );
  }
  if (f.text !== undefined) return <pre className="preview-box preview-text small">{f.text || '(vazio)'}</pre>;
  if (f.url && f.info.preview === 'image') return <div className="preview-box preview-media"><img src={f.url} alt={f.file.name} /></div>;
  if (f.url && f.info.preview === 'pdf') return <iframe title={f.file.name} src={f.url} className="preview-box preview-pdf" />;
  return <p className="small muted mt-2">Pré-visualização do conteúdo indisponível para este formato nesta versão.</p>;
}

export function ImportDialog({ open, onClose, defaultCategory }: { open: boolean; onClose: () => void; defaultCategory?: CatalogCategory }) {
  const [files, setFiles] = useState<SelectedFile[]>([]);
  const [category, setCategory] = useState<string>(defaultCategory ?? '');
  const [drag, setDrag] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const seq = useRef(0);

  // Libera as URLs temporárias ao fechar.
  useEffect(() => {
    if (!open) {
      setFiles((fs) => { fs.forEach((f) => f.url && URL.revokeObjectURL(f.url)); return []; });
      setCategory(defaultCategory ?? '');
    }
  }, [open, defaultCategory]);

  const add = async (list: FileList | null) => {
    if (!list) return;
    const built = await Promise.all(Array.from(list).map((f) => buildPreview(f, String(++seq.current))));
    setFiles((fs) => [...fs, ...built]);
  };

  const remove = (id: string) =>
    setFiles((fs) => fs.filter((f) => { if (f.id === id && f.url) URL.revokeObjectURL(f.url); return f.id !== id; }));

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title="Importar dados para a base de conhecimento"
      description="Selecione planilhas, PDFs, imagens ou outros arquivos para pré-visualizar."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Fechar</Button>
          <Button disabled title="O processamento será implementado na próxima etapa">Processar importação</Button>
        </>
      }
    >
      <Banner tone="info" title="Somente pré-visualização.">
        O processamento dos arquivos ainda não foi implementado. Os arquivos são lidos apenas no seu navegador para
        conferência — <strong>nenhum dado é importado ou salvo</strong>.
      </Banner>

      <div className="field mb-3">
        <label htmlFor="import-category">Categoria de destino (opcional)</label>
        <select id="import-category" className="select" value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">Definir durante o processamento</option>
          {CATALOG_CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
        </select>
      </div>

      <div
        className={`dropzone ${drag ? 'drag' : ''}`}
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); add(e.dataTransfer.files); }}
      >
        <FileUp />
        <p className="cell-main mt-2">Arraste arquivos aqui ou clique para selecionar</p>
        <p className="small muted">CSV, XLSX, PDF, JSON, TXT, DOCX, PNG, JPG · até {formatBytes(MAX_FILE_BYTES)} por arquivo</p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPTED_EXTENSIONS}
          className="visually-hidden"
          data-testid="import-input"
          onChange={(e) => { add(e.target.files); e.target.value = ''; }}
        />
      </div>

      {files.length > 0 && (
        <div className="mt-4">
          <div className="row between mb-3">
            <strong>{files.length} arquivo(s) selecionado(s)</strong>
            <span className="small muted">Status: aguardando processamento</span>
          </div>
          {files.map((f) => (
            <div key={f.id} className="file-row">
              <div className="row">
                <span className="file-ext">{f.file.name.split('.').pop()?.toUpperCase().slice(0, 4)}</span>
                <div className="grow">
                  <div className="cell-main file-name">{f.file.name}</div>
                  <div className="cell-sub">{f.info.label} · {formatBytes(f.file.size)} · Processamento futuro: {f.info.futureProcessing}</div>
                </div>
                <span className={`badge ${f.error ? 'badge-danger' : 'badge-muted'}`}>{f.error ? 'Inválido' : 'Não importado'}</span>
                <IconButton icon={Trash2} label={`Remover ${f.file.name}`} danger onClick={() => remove(f.id)} />
              </div>
              <Preview f={f} />
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}
