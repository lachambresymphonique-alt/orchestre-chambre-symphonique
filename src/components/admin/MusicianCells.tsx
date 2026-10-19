'use client';

import './admin-theme.css';
import './admin-musicians-list.css';
import Image from 'next/image';
import { skipOptimization } from '@/lib/imageOptimization';
import { useEffect, useState } from 'react';
import { musicianStatus } from '@/lib/musicianVisibility';
import { loadMedia, mediaFromCell, type MediaDoc } from './mediaCache';

/**
 * Cellules de la liste Musiciens dans l'admin.
 *
 * Photo : une vignette ronde de même taille pour tous, cadrée sur le point
 * focal de l'image, ou les initiales quand il n'y a pas de photo — au lieu de
 * la vignette et du nom de fichier par défaut de Payload. Instrument : un
 * tiret discret quand il n'est pas renseigné, plutôt que « <Pas de …> ».
 */

type CellProps = {
  cellData?: unknown;
  rowData?: Record<string, any>;
  link?: boolean;
  linkURL?: string;
};

function initials(name: unknown): string {
  const words = String(name ?? '')
    .trim()
    .split(/[\s-]+/)
    .filter(Boolean);
  return ((words[0]?.[0] ?? '') + (words.length > 1 ? words[words.length - 1][0] : '')).toUpperCase() || '?';
}

export function MusicianPhotoCell({ cellData, rowData, link, linkURL }: CellProps) {
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

  const name = rowData?.name ?? '';
  const avatar = (
    <span className="lcs-avatar" title={name}>
      {media?.url ? (
        <Image
          src={media.url}
          unoptimized={skipOptimization(media)}
          alt={media.alt || name}
          width={88}
          height={88}
          sizes="44px"
          style={{
            objectPosition: `${media.focalX ?? 50}% ${media.focalY ?? 30}%`,
          }}
        />
      ) : (
        <span className="lcs-avatar__initials" aria-label={id ? undefined : 'Pas de photo'}>
          {initials(name)}
        </span>
      )}
    </span>
  );

  if (!link) return avatar;
  const href = linkURL || (rowData?.id != null ? `/admin/collections/musicians/${rowData.id}` : undefined);
  return href ? (
    <a className="lcs-avatar-link" href={href} aria-label={name ? `Ouvrir la fiche de ${name}` : 'Ouvrir la fiche'}>
      {avatar}
    </a>
  ) : (
    avatar
  );
}

export function MusicianInstrumentCell({ cellData }: CellProps) {
  const value = typeof cellData === 'string' ? cellData.trim() : '';
  return value ? <span>{value}</span> : <span className="lcs-cell-empty" aria-label="Non renseigné">—</span>;
}

export function MusicianStatusCell({ cellData }: CellProps) {
  const status = musicianStatus(cellData);
  return <span className={`lcs-status lcs-status--${status.tone}`}>{status.label}</span>;
}

export default MusicianPhotoCell;
