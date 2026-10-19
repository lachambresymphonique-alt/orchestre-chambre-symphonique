'use client';

import './admin-theme.css';
import './admin-media-list.css';
import { useListDrawerContext } from '@payloadcms/ui';
import Link from 'next/link';
import { useEffect, useState, type ReactNode } from 'react';
import { parseVideoUrl } from '@/lib/video';
import { loadMedia, mediaFromCell, thumbnailOf, type MediaDoc } from './mediaCache';

/**
 * Cellules des listes d'images de l'admin : on montre l'image plutôt que son
 * nom de fichier.
 *
 * - MediaItemThumbCell : colonne « Miniature » de la liste Médias. Le thème
 *   donne 64 px à cette colonne ; la cellule de Payload y mettait l'image et
 *   le nom du fichier, qui se repliait lettre par lettre.
 * - MediaFileCell : première colonne de la Bibliothèque d'images.
 * - MediaAltCell : description de l'image, ou « Sans description ».
 */

type CellProps = {
  cellData?: unknown;
  collectionSlug?: string;
  rowData?: Record<string, any>;
  link?: boolean;
  linkURL?: string;
  onClick?: (args: { cellData: unknown; collectionSlug?: string; rowData?: Record<string, any> }) => void;
};

/**
 * Comme la cellule par défaut de Payload : un bouton dans une fenêtre de choix
 * (« Choisir dans la bibliothèque »), un lien dans une liste. Payload ne donne
 * pas `onClick` aux cellules personnalisées dans ces fenêtres : on lit
 * directement leur contexte.
 */
function CellLink({ cellData, collectionSlug, rowData, link, linkURL, onClick, label, children }: CellProps & { label: string; children: ReactNode }) {
  const { drawerSlug, onSelect } = useListDrawerContext();
  if (link && drawerSlug && typeof onSelect === 'function' && rowData?.id != null) {
    return (
      <button
        type="button"
        className="lcs-cell-link"
        aria-label={label.replace(/^Ouvrir/, 'Choisir')}
        onClick={() => onSelect({ collectionSlug: collectionSlug as never, doc: rowData as never, docID: rowData.id })}
      >
        {children}
      </button>
    );
  }
  if (typeof onClick === 'function') {
    return (
      <button type="button" className="lcs-cell-link" aria-label={label} onClick={() => onClick({ cellData, collectionSlug, rowData })}>
        {children}
      </button>
    );
  }
  const href = linkURL || (rowData?.id != null && collectionSlug ? `/admin/collections/${collectionSlug}/${rowData.id}` : undefined);
  if (link && href) {
    return (
      <Link className="lcs-cell-link" href={href} prefetch={false} aria-label={label}>
        {children}
      </Link>
    );
  }
  return <span className="lcs-cell-link">{children}</span>;
}

function useMedia(cellData: unknown): MediaDoc | null {
  const { media: inline, id } = mediaFromCell(cellData);
  const [media, setMedia] = useState<MediaDoc | null>(inline);
  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    loadMedia(id).then((m) => {
      if (!cancelled) setMedia(m);
    });
    return () => {
      cancelled = true;
    };
  }, [id]);
  return inline ?? media;
}

const ICONS: Record<string, ReactNode> = {
  video: <path d="M4 6.5h16v11H4zM10.5 9.5v5l4-2.5z" />,
  audio: <path d="M9 17.5V6.5l10-2v11M9 17.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0zm10-2a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0z" />,
  photo: <path d="M4 5.5h16v13H4zM4 15.5l4.5-4.5 4 4 2.5-2.5 5 5M15.5 9.5h.01" />,
};

function TypeIcon({ type }: { type?: string }) {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {ICONS[type ?? ''] ?? ICONS.photo}
    </svg>
  );
}

export function MediaItemThumbCell(props: CellProps) {
  const media = useMedia(props.cellData);
  const row = props.rowData ?? {};
  const uploaded = thumbnailOf(media);
  // Sans image choisie, la page Médias reprend la miniature de la vidéo YouTube.
  const youtube = !uploaded && row.type === 'video' ? parseVideoUrl(row.url) : null;
  const src = uploaded || (youtube?.provider === 'youtube' ? youtube.thumbnailFallbackUrl : null);
  const title = row.title ? String(row.title) : 'ce média';

  return (
    <CellLink {...props} label={`Ouvrir ${title}`}>
      <span className="lcs-thumb lcs-thumb--wide" title={youtube && src ? 'Miniature reprise de YouTube' : undefined}>
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element -- vignette déjà réduite par Payload : pas d'optimisation Vercel
          <img src={src} alt="" loading="lazy" decoding="async" />
        ) : (
          <span className="lcs-thumb__empty" role="img" aria-label="Pas de miniature">
            <TypeIcon type={row.type} />
          </span>
        )}
        {youtube && src && (
          <span className="lcs-thumb__badge" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="10" height="10" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          </span>
        )}
      </span>
    </CellLink>
  );
}

function formatSize(bytes?: number | null): string {
  if (!bytes || bytes <= 0) return '';
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace('.', ',')} Mo`;
}

export function MediaFileCell(props: CellProps) {
  const row = (props.rowData ?? {}) as MediaDoc;
  const src = thumbnailOf(row);
  const name = row.filename || String(props.cellData ?? '');
  // Logos et affiches (SVG, PNG) en entier ; photos recadrées.
  const whole = row.mimeType === 'image/svg+xml' || row.mimeType === 'image/png';
  const meta = [
    row.mimeType === 'image/svg+xml' ? 'SVG' : row.width && row.height ? `${row.width} × ${row.height}` : '',
    formatSize(row.filesize),
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <CellLink {...props} label={`Ouvrir l’image ${row.alt || name}`}>
      <span className="lcs-file">
        <span className={`lcs-thumb${whole ? ' lcs-thumb--whole' : ''}`}>
          {src ? (
            // eslint-disable-next-line @next/next/no-img-element -- vignette déjà réduite par Payload : pas d'optimisation Vercel
            <img src={src} alt="" loading="lazy" decoding="async" />
          ) : (
            <span className="lcs-thumb__empty" aria-hidden="true">
              <TypeIcon type="photo" />
            </span>
          )}
        </span>
        <span className="lcs-file__text">
          <span className="lcs-file__name" title={name}>
            {name}
          </span>
          {meta && <span className="lcs-file__meta">{meta}</span>}
        </span>
      </span>
    </CellLink>
  );
}

export function MediaAltCell({ cellData }: CellProps) {
  const alt = typeof cellData === 'string' ? cellData.trim() : '';
  return alt ? <span className="lcs-alt">{alt}</span> : <span className="lcs-alt lcs-alt--missing">Sans description</span>;
}
