import { useEffect, useState } from 'react';
import { useTheme } from '@/theme/ThemeContext';
import { BRAND } from './brand';

type Status = 'loading' | 'ok' | 'missing';

/** Verifica se uma imagem existe (carregando-a uma vez). */
export function useImageStatus(src: string): Status {
  const [status, setStatus] = useState<Status>('loading');
  useEffect(() => {
    let alive = true;
    setStatus('loading');
    const img = new Image();
    img.onload = () => alive && setStatus('ok');
    img.onerror = () => alive && setStatus('missing');
    img.src = src;
    return () => {
      alive = false;
    };
  }, [src]);
  return status;
}

/**
 * Logo oficial da Fesare. Nunca redesenha a marca:
 *  - usa o arquivo original (ou a versão oficial para fundo escuro, se existir);
 *  - no tema escuro sem versão própria, mostra a original sobre base branca;
 *  - se nenhum arquivo existir, mostra o nome da empresa em texto simples.
 */
export function BrandLogo({ compact = false, className = '', hideIfMissing = false }: { compact?: boolean; className?: string; /** Não mostra o nome em texto quando o arquivo da logo não existe. */ hideIfMissing?: boolean }) {
  const { theme } = useTheme();
  const original = useImageStatus(BRAND.assets.logo);
  const dark = useImageStatus(BRAND.assets.logoDark);
  const compactImg = useImageStatus(BRAND.assets.logoCompact);

  if (original === 'loading') return <span className={`brand-logo ${className}`} style={{ height: compact ? 30 : 40, width: compact ? 30 : 120 }} aria-hidden />;

  if (original === 'missing') {
    if (hideIfMissing) return null;
    if (compact) return <span className={`brand-initial ${className}`} title={BRAND.name}>{BRAND.name.charAt(0)}</span>;
    return (
      <span className={`brand-text ${className}`}>
        <span className="brand-name">{BRAND.name}</span>
        <span className="brand-sub brand-sub-block">{BRAND.tagline}</span>
      </span>
    );
  }

  const alt = `${BRAND.name} — ${BRAND.tagline}`;
  if (compact && compactImg === 'ok') {
    return <img className={`brand-logo ${className}`} src={BRAND.assets.logoCompact} alt={alt} />;
  }
  if (theme === 'dark' && dark === 'ok') {
    return <img className={`brand-logo ${className}`} src={BRAND.assets.logoDark} alt={alt} />;
  }
  const img = <img className={`brand-logo ${className}`} src={BRAND.assets.logo} alt={alt} />;
  return theme === 'dark' ? <span className="brand-plate">{img}</span> : img;
}
