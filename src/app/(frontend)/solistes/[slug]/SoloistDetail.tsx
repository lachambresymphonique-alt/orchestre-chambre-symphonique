'use client';

import './soloist.css';
import Image from 'next/image';
import Link from 'next/link';
import { useLiveDoc } from '@/hooks/useLiveDocument';
import { useLivePreviewSync } from '@/hooks/useLivePreviewSync';
import { placeholderForMusician } from '@/lib/unsplash';
import type { ConcertCard } from '@/lib/concerts';
import { describeDateRange } from '@/components/ConcertPosters';

/**
 * Page d'un·e soliste invité·e (/solistes/<slug>), mise en page des fiches
 * musiciens : portrait, instrument, nom, précision, phrase, biographie, site,
 * puis ses concerts à venir avec l'orchestre. Aperçu en direct depuis l'admin
 * (Contenu → Solistes).
 */

export type SoloistDoc = {
  id: string | number;
  name: string;
  slug?: string | null;
  instrument?: string | null;
  role?: string | null;
  photo?: { url?: string | null; alt?: string | null } | number | string | null;
  bio?: string | null;
  tagline?: string | null;
  website?: string | null;
};

const shortUrl = (url: string) => url.replace(/^https?:\/\/(www\.)?/i, '').replace(/\/$/, '');

export function SoloistDetail({ soloist, concerts }: { soloist: SoloistDoc; concerts: ConcertCard[] }) {
  const s = useLiveDoc<SoloistDoc>('soloists', soloist, 1);
  useLivePreviewSync(s);
  const photo = s.photo && typeof s.photo === 'object' ? s.photo : null;
  const bio = (s.bio || '').split(/\n\n+/).map((p) => p.trim()).filter(Boolean);
  const website = s.website?.trim() || '';

  return (
    <div className="musician-detail soloist-detail">
      <article className="musician-feature">
        <div className="musician-feature__portrait" data-live-field="photo">
          <Image
            src={photo?.url || placeholderForMusician(s.name || 'Soliste')}
            alt={photo?.alt || s.name}
            fill
            priority
            sizes="(max-width: 900px) 100vw, 50vw"
            style={{ objectFit: 'cover', objectPosition: 'center' }}
          />
          <div className="musician-feature__halo" aria-hidden />
        </div>

        <div className="musician-feature__text">
          <p className="breadcrumb">
            <Link href="/">Accueil</Link> &nbsp;/&nbsp;{' '}
            <span className="breadcrumb-current">Solistes invités</span>
          </p>

          <p className="eyebrow eyebrow--gold" data-live-field="instrument">
            {s.instrument || 'Soliste'}
          </p>
          <h1 className="musician-feature__name" data-live-field="name">
            {s.name}
          </h1>
          {s.role && (
            <p className="musician-feature__instrument" data-live-field="role">
              {s.role}
            </p>
          )}

          {s.tagline && (
            <>
              <hr className="velvet-rule long" />
              <p className="musician-feature__tagline" data-live-field="tagline">
                {s.tagline}
              </p>
            </>
          )}

          {bio.length > 0 && (
            <div className="musician-feature__bio" data-live-field="bio">
              {bio.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          )}

          {website && (
            <p className="soloist-detail__website" data-live-field="website">
              <a href={website} target="_blank" rel="noopener noreferrer" className="link-arrow">
                {shortUrl(website)} →
              </a>
            </p>
          )}

          {concerts.length > 0 && (
            <section className="soloist-detail__concerts" aria-labelledby="soloist-concerts">
              <h2 id="soloist-concerts" className="musician-feature__credits-title">
                À l’affiche avec l’orchestre
              </h2>
              <ul className="soloist-detail__concert-list">
                {concerts.map((c) => {
                  const multiple = c.performances.length > 1;
                  const when = multiple
                    ? `${c.performances.length} dates · ${describeDateRange(c.performances)}`
                    : c.date.long;
                  const where = [...new Set(c.performances.map((p) => p.venue).filter(Boolean))].join(' · ') || c.venue;
                  return (
                    <li key={c.id}>
                      <Link href={c.url || '/#concerts'} className="soloist-detail__concert">
                        <span className="soloist-detail__concert-when">{when}</span>
                        <span className="soloist-detail__concert-title">{c.title}</span>
                        {where && <span className="soloist-detail__concert-where">{where}</span>}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          <div className="musician-feature__back">
            <Link href="/concerts" className="link-arrow">
              ← Tous les concerts
            </Link>
          </div>
        </div>
      </article>
    </div>
  );
}
