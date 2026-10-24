/**
 * Marca Fesare.
 *
 * Coloque os arquivos OFICIAIS da logo em `public/brand/` com estes nomes.
 * Nenhuma logo é desenhada pelo sistema: sem o arquivo, a interface mostra
 * apenas o nome da empresa em texto.
 *
 *  - logo        (obrigatório) arquivo original da logo.
 *  - logoDark    (opcional)    versão oficial preparada para fundo escuro.
 *                              Sem ela, no tema escuro a logo original é exibida
 *                              sobre uma base branca, preservando a fidelidade.
 *  - logoCompact (opcional)    símbolo/versão reduzida para o menu recolhido.
 *                              Sem ela, a logo original é reduzida proporcionalmente.
 *  - favicon     (opcional)    ícone da aba do navegador (index.html).
 */
export const BRAND = {
  name: 'Fesare',
  tagline: 'Soluções em Alumínio',
  assets: {
    logo: '/brand/fesare-logo.png',
    logoDark: '/brand/fesare-logo-dark.png',
    logoCompact: '/brand/fesare-logo-compact.png',
    favicon: '/brand/fesare-favicon.png',
  },
} as const;
