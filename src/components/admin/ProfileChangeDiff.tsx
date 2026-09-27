'use client';

import './admin-profile-change.css';
import { useEffect, useState } from 'react';
import { useDocumentInfo } from '@payloadcms/ui';

/**
 * En tête d'une modification proposée : la fiche en ligne et la proposition,
 * champ par champ. Relit la version enregistrée (/api/membres/modifications/:id)
 * à chaque sauvegarde, corrections de l'admin comprises.
 */

type Row = {
  name: string;
  label: string;
  kind: string;
  current: string;
  proposed: string;
  currentUrl: string | null;
  proposedUrl: string | null;
  conflict: boolean;
};

function Value({ kind, value, url }: { kind: string; value: string; url: string | null }) {
  if (!value) return <span className="lcs-diff__empty">vide</span>;
  if (kind === 'photo') return url ? <img className="lcs-diff__photo" src={url} alt="" /> : <span>Photo n° {value}</span>;
  if (kind === 'lines') {
    return (
      <ul className="lcs-diff__list">
        {value.split('\n').map((line, i) => (
          <li key={i}>{line}</li>
        ))}
      </ul>
    );
  }
  return <p className="lcs-diff__text">{value}</p>;
}

export function ProfileChangeDiff() {
  const { id, lastUpdateTime } = useDocumentInfo() as { id?: string | number; lastUpdateTime?: number };
  const [rows, setRows] = useState<Row[] | null>(null);
  const [musician, setMusician] = useState<{ name: string; slug?: string } | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    fetch(`/api/membres/modifications/${id}`, { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (cancelled || !json) return;
        setRows(json.rows);
        setMusician(json.musician);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [id, lastUpdateTime]);

  if (!id || !rows) return null;

  return (
    <section className="lcs-diff" aria-label="Comparaison avec la fiche en ligne">
      <header className="lcs-diff__head">
        <p className="lcs-diff__title">
          Comparaison avec la fiche en ligne{musician ? ` de ${musician.name}` : ''}
        </p>
        {musician?.slug && (
          <a className="lcs-diff__link" href={`/musiciens/${musician.slug}`} target="_blank" rel="noreferrer">
            Voir la fiche publique ↗
          </a>
        )}
      </header>
      {rows.length === 0 && <p className="lcs-diff__empty">Aucun champ coché.</p>}
      {rows.map((row) => (
        <div key={row.name} className="lcs-diff__row">
          <p className="lcs-diff__label">
            {row.label}
            {row.conflict && (
              <span className="lcs-diff__conflict">modifié par l’équipe depuis l’envoi</span>
            )}
          </p>
          <div className="lcs-diff__cols">
            <div className="lcs-diff__cell">
              <span className="lcs-diff__tag">En ligne</span>
              <Value kind={row.kind} value={row.current} url={row.currentUrl} />
            </div>
            <div className="lcs-diff__cell lcs-diff__cell--proposed">
              <span className="lcs-diff__tag">Proposé</span>
              <Value kind={row.kind} value={row.proposed} url={row.proposedUrl} />
            </div>
          </div>
        </div>
      ))}
    </section>
  );
}

export default ProfileChangeDiff;
