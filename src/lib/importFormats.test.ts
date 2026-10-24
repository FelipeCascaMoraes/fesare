import { detectFormat, previewCsv, splitCsvLine } from './importFormats';

describe('importação — pré-visualização', () => {
  it('detecta formatos', () => {
    expect(detectFormat('tabela.CSV').format).toBe('csv');
    expect(detectFormat('catalogo.xlsx').format).toBe('xlsx');
    expect(detectFormat('manual.pdf').preview).toBe('pdf');
    expect(detectFormat('foto.jpeg').format).toBe('image');
    expect(detectFormat('arquivo.exe').format).toBe('unknown');
  });

  it('lê CSV com ponto e vírgula e aspas', () => {
    const p = previewCsv('﻿codigo;nome;cor\nA1;"Janela; 2 folhas";Branco\nA2;Porta;Preto\n', 1);
    expect(p.delimiter).toBe(';');
    expect(p.headers).toEqual(['codigo', 'nome', 'cor']);
    expect(p.rows).toEqual([['A1', 'Janela; 2 folhas', 'Branco']]);
    expect(p.totalRows).toBe(2);
  });

  it('trata aspas escapadas', () => {
    expect(splitCsvLine('"a ""b""",c', ',')).toEqual(['a "b"', 'c']);
  });

  it('lida com arquivo vazio', () => {
    expect(previewCsv('').totalRows).toBe(0);
  });
});
