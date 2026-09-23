'use client';

import './admin-concerts.css';
import { useEffect, useState } from 'react';
import { useField } from '@payloadcms/ui';
import { ConcertDateCell } from './ConcertDateCell';

type Props = { path: string };

type ConcertLite = {
  id: number | string;
  title?: string;
  status?: string;
  performances?: unknown[];
  date?: string;
  time?: string;
  venue?: string;
};

/** Identifiants de la relation, quelle que soit sa forme (id seul, fiche peuplée, liste). */
function idsOf(value: unknown): Array<string | number> {
  const list = Array.isArray(value) ? value : [value];
  return list
    .map((v) => {
      if (v && typeof v === 'object') {
        const o = v as { id?: unknown; value?: unknown };
        return (o.value ?? o.id) as string | number | undefined;
      }
      return v as string | number | undefined;
    })
    .filter((v): v is string | number => v !== null && v !== undefined && v !== '');
}

/**
 * Sous un champ de concert(s) : chaque concert choisi en une ligne — titre,
 * dates (ou plage de dates), nombre de représentations, lieux et état (à
 * venir, passé, brouillon, annulé) — pour distinguer deux concerts de même titre.
 */
export function ConcertRelationSummary({ path }: Props) {
  const { value } = useField<unknown>({ path });
  const ids = idsOf(value);
  const key = ids.join(',');
  const [docs, setDocs] = useState<ConcertLite[]>([]);

  useEffect(() => {
    if (!key) {
      setDocs([]);
      return;
    }
    let cancelled = false;
    const query = key
      .split(',')
      .map((id, i) => `where[id][in][${i}]=${encodeURIComponent(id)}`)
      .join('&');
    fetch(`/api/concerts?${query}&depth=0&limit=100&sort=-date`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((res) => !cancelled && setDocs(Array.isArray(res?.docs) ? res.docs : []))
      .catch(() => !cancelled && setDocs([]));
    return () => {
      cancelled = true;
    };
  }, [key]);

  if (!key || docs.length === 0) return null;

  return (
    <ul className="lcs-concert-summary">
      {docs.map((doc) => (
        <li key={doc.id} className="lcs-concert-summary__item">
          <span className="lcs-concert-summary__title">{doc.title || 'Concert sans titre'}</span>
          <ConcertDateCell cellData={doc.performances} rowData={doc} />
        </li>
      ))}
    </ul>
  );
}

export default ConcertRelationSummary;
