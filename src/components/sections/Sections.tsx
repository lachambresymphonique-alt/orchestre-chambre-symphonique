import './sections.css';
import { Fragment, type ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { PostRichText } from '@/components/PostRichText';
import { ConcertPosters } from '@/components/ConcertPosters';
import { RichText, renderInline } from '@/lib/richText';
import { renderEmphasis } from '@/lib/emphasis';
import { parseVideoUrl } from '@/lib/video';
import { toConcertCard, type ConcertCard, type ConcertDoc } from '@/lib/concerts';
import { SECTION_NAMES, hasRichText, sectionLook, type SectionBlock } from '@/lib/sections';
import { PhotoGrid } from './PhotoGrid';
import { LazyVideo } from './LazyVideo';
import { InsertPoint, PreviewScroll, SectionToolbar } from './PreviewEditing';
import type { InlineKind } from './InlineEditing';

/**
 * Rendu des sections d'une page libre, partagé par la page publique (/[slug])
 * et l'aperçu en direct de l'admin (/apercu/pages). Chaque type reprend une
 * section déjà dessinée du site (citation signature, texte + image…).
 *
 * `data-live-field="layout__N"` relie chaque section à sa ligne dans l'admin :
 * un clic dans l'aperçu ouvre la section (voir useLivePreviewSync).
 * Sur la page publique, une section masquée ou vide n'apparaît pas ; dans
 * l'aperçu, elle reste visible, estompée, avec une étiquette.
 */

type Media = { url?: string | null; alt?: string | null; width?: number | null; height?: number | null };
type Link_ = { label?: string | null; url?: string | null } | null | undefined;

type Props = {
  sections: SectionBlock[];
  /** Prochains concerts, chargés par la page quand une section « Concerts » les demande. */
  upcomingConcerts?: ConcertCard[];
  /** Aperçu de l'admin : sections vides et masquées visibles, avec étiquette. */
  preview?: boolean;
};

const CONCERT_LABELS = {
  next: 'Prochain concert',
  today: 'Aujourd’hui',
  cancelled: 'Annulé',
  booking: 'Réserver une place',
  bookingShort: 'Réserver',
};

const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '');
const media = (v: unknown): Media | null =>
  v && typeof v === 'object' && typeof (v as Media).url === 'string' ? (v as Media) : null;
const link = (v: unknown): { label: string; url: string } | null => {
  const l = v as Link_;
  const url = str(l?.url);
  return url ? { label: str(l?.label) || 'En savoir plus', url } : null;
};

/**
 * Marques de l'édition directe dans l'aperçu (voir InlineEditing) : le champ
 * d'un texte ou d'une photo dans le formulaire. Rien sur la page publique.
 */
type Edit = {
  text: (field: string, kind: InlineKind) => Record<string, string> | undefined;
  image: (field: string) => Record<string, string> | undefined;
};

const NO_EDIT: Edit = { text: () => undefined, image: () => undefined };

function editFor(index: number): Edit {
  const base = `layout.${index}`;
  return {
    text: (field, kind) => ({ 'data-lcs-edit': `${base}.${field}`, 'data-lcs-kind': kind }),
    image: (field) => ({ 'data-lcs-image': `${base}.${field}` }),
  };
}

function isExternal(url: string) {
  return /^(https?:|mailto:|tel:)/.test(url);
}

function SmartLink({ href, className, children }: { href: string; className?: string; children: ReactNode }) {
  if (isExternal(href)) {
    const newTab = href.startsWith('http');
    return (
      <a href={href} className={className} {...(newTab ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}

function SectionHead({ block, ed = NO_EDIT }: { block: SectionBlock; ed?: Edit }) {
  const eyebrow = str(block.eyebrow);
  const title = str(block.title);
  if (!eyebrow && !title) return null;
  return (
    <header className="lcs-section__head">
      {eyebrow && (
        <p className="eyebrow eyebrow--accent" {...ed.text('eyebrow', 'plain')}>
          {eyebrow}
        </p>
      )}
      {title && (
        <h2 className="lcs-section__title" {...ed.text('title', 'title')}>
          {renderEmphasis(title)}
        </h2>
      )}
    </header>
  );
}

function Photo({ image, sizes, className, attrs }: { image: Media; sizes: string; className?: string; attrs?: Record<string, string> }) {
  return (
    <div className={`lcs-photo ${className ?? ''}`} {...attrs}>
      <Image src={image.url!} alt={image.alt ?? ''} fill sizes={sizes} style={{ objectFit: 'cover' }} />
    </div>
  );
}

/** Vrai si la section n'a rien à montrer (elle n'apparaît alors pas sur le site). */
function isEmpty(block: SectionBlock, upcoming: ConcertCard[]): boolean {
  switch (block.blockType) {
    case 'text':
      return !hasRichText(block.content) && !str(block.title);
    case 'quote':
      return !str(block.quote);
    case 'mediaText':
      return !media(block.image) && !str(block.text) && !str(block.title);
    case 'columns':
      return !Array.isArray(block.items) || block.items.length === 0;
    case 'gallery':
      return !Array.isArray(block.images) || !block.images.some((i) => media((i as { image?: unknown })?.image));
    case 'video':
      return !parseVideoUrl(str(block.url));
    case 'cta':
      return !str(block.title);
    case 'concerts':
      return concertsOf(block, upcoming).length === 0;
    default:
      return true;
  }
}

function concertsOf(block: SectionBlock, upcoming: ConcertCard[]): ConcertCard[] {
  if (block.source === 'selected') {
    const docs = Array.isArray(block.concerts) ? block.concerts : [];
    return docs
      .filter((d): d is ConcertDoc => Boolean(d) && typeof d === 'object')
      .map((d) => toConcertCard(d))
      .filter((c): c is ConcertCard => c !== null);
  }
  const limit = typeof block.limit === 'number' && block.limit > 0 ? block.limit : 6;
  return upcoming.slice(0, limit);
}

// ── Les types de sections ───────────────────────────────────────────────────

function TextBody({ block, ed }: { block: SectionBlock; ed: Edit }) {
  return (
    <>
      <SectionHead block={block} ed={ed} />
      <div className="rich-text-content lcs-text">
        <PostRichText data={block.content} />
      </div>
    </>
  );
}

function QuoteBody({ block, ed }: { block: SectionBlock; ed: Edit }) {
  const author = str(block.author);
  const role = str(block.role);
  const photo = media(block.photo);
  return (
    <figure className="lcs-quote">
      <svg viewBox="0 0 60 48" aria-hidden className="lcs-quote__glyph">
        <path d="M0 48V28C0 12.5 8.4 3.2 25.2 0l2.4 6.4C18.6 9 14.2 14.4 13.8 22H25.2V48H0Zm34.8 0V28C34.8 12.5 43.2 3.2 60 0l2.4 6.4C53.4 9 49 14.4 48.6 22H60V48H34.8Z" />
      </svg>
      <blockquote {...ed.text('quote', 'inline')}>{renderInline(str(block.quote))}</blockquote>
      {(author || role || photo) && (
        <figcaption>
          {photo && <Photo image={photo} sizes="64px" className="lcs-quote__photo" attrs={ed.image('photo')} />}
          <span className="lcs-quote__rule" aria-hidden />
          {author && (
            <span className="lcs-quote__author" {...ed.text('author', 'plain')}>
              {author}
            </span>
          )}
          {role && (
            <span className="lcs-quote__role" {...ed.text('role', 'plain')}>
              {role}
            </span>
          )}
        </figcaption>
      )}
    </figure>
  );
}

function MediaTextBody({ block, ed }: { block: SectionBlock; ed: Edit }) {
  const image = media(block.image);
  const l = link(block.link);
  return (
    <div className="lcs-mediatext">
      <div className="lcs-mediatext__media">
        {image ? (
          <Photo image={image} sizes="(max-width: 900px) 100vw, 45vw" attrs={ed.image('image')} />
        ) : (
          <div className="lcs-photo lcs-photo--empty" aria-hidden {...ed.image('image')} />
        )}
      </div>
      <div className="lcs-mediatext__text">
        <SectionHead block={block} ed={ed} />
        {str(block.text) && (
          <div className="lcs-prose rich-text" {...ed.text('text', 'prose')}>
            <RichText text={str(block.text)} lead />
          </div>
        )}
        {l && (
          <SmartLink href={l.url} className="link-arrow lcs-section__link">
            {l.label} →
          </SmartLink>
        )}
      </div>
    </div>
  );
}

type ColumnItem = { id?: string; title?: string; text?: string; image?: unknown; link?: unknown };

function ColumnsBody({ block, ed }: { block: SectionBlock; ed: Edit }) {
  const items = (Array.isArray(block.items) ? block.items : []) as ColumnItem[];
  return (
    <>
      <SectionHead block={block} ed={ed} />
      <div className="lcs-columns" data-count={items.length}>
        {items.map((item, i) => {
          const image = media(item.image);
          const l = link(item.link);
          return (
            <article key={item.id ?? i} className="lcs-columns__item">
              {image && (
                <Photo image={image} sizes="(max-width: 800px) 100vw, 33vw" className="lcs-columns__image" attrs={ed.image(`items.${i}.image`)} />
              )}
              {str(item.title) && (
                <h3 className="lcs-columns__title" {...ed.text(`items.${i}.title`, 'title')}>
                  {renderEmphasis(str(item.title))}
                </h3>
              )}
              {str(item.text) && (
                <p className="lcs-columns__text" {...ed.text(`items.${i}.text`, 'inline')}>
                  {renderInline(str(item.text))}
                </p>
              )}
              {l && (
                <SmartLink href={l.url} className="link-arrow lcs-columns__link">
                  {l.label} →
                </SmartLink>
              )}
            </article>
          );
        })}
      </div>
    </>
  );
}

function GalleryBody({ block, ed }: { block: SectionBlock; ed: Edit }) {
  const photos = (Array.isArray(block.images) ? block.images : [])
    .map((row) => {
      const r = row as { id?: string; image?: unknown; caption?: string };
      const image = media(r.image);
      return image ? { id: r.id, image, caption: str(r.caption) } : null;
    })
    .filter((p): p is NonNullable<typeof p> => p !== null);
  return (
    <>
      <SectionHead block={block} ed={ed} />
      <PhotoGrid photos={photos} variant={block.variant === 'grid' ? 'grid' : 'mosaic'} />
    </>
  );
}

function VideoBody({ block, ed }: { block: SectionBlock; ed: Edit }) {
  const info = parseVideoUrl(str(block.url));
  const poster = media(block.poster);
  const caption = str(block.caption);
  if (!info) return <SectionHead block={block} ed={ed} />;
  return (
    <>
      <SectionHead block={block} ed={ed} />
      <figure className="lcs-video">
        <LazyVideo
          embedUrl={info.embedUrl}
          poster={poster?.url ?? info.thumbnailUrl}
          posterFallback={info.thumbnailFallbackUrl}
          title={str(block.title) || 'Vidéo'}
        />
        {caption && <figcaption {...ed.text('caption', 'inline')}>{renderInline(caption)}</figcaption>}
      </figure>
    </>
  );
}

function CtaBody({ block, plainButton, ed }: { block: SectionBlock; plainButton: boolean; ed: Edit }) {
  const button = link(block.button);
  const secondary = link(block.secondary);
  const text = str(block.text);
  return (
    <div className="lcs-cta">
      <div className="lcs-cta__text">
        {str(block.eyebrow) && (
          <p className="eyebrow eyebrow--accent" {...ed.text('eyebrow', 'plain')}>
            {str(block.eyebrow)}
          </p>
        )}
        <h2 className="lcs-section__title" {...ed.text('title', 'title')}>
          {renderEmphasis(str(block.title))}
        </h2>
        {text && (
          <p className="lcs-cta__lede" {...ed.text('text', 'inline')}>
            {renderInline(text)}
          </p>
        )}
      </div>
      {(button || secondary) && (
        <div className="lcs-cta__actions">
          {button && (
            <SmartLink href={button.url} className={plainButton ? 'link-arrow' : 'btn-filled'}>
              {button.label}
              {plainButton ? ' →' : ''}
            </SmartLink>
          )}
          {secondary && (
            <SmartLink href={secondary.url} className="link-arrow">
              {secondary.label} →
            </SmartLink>
          )}
        </div>
      )}
    </div>
  );
}

function ConcertsBody({ block, upcoming, preview, ed }: { block: SectionBlock; upcoming: ConcertCard[]; preview: boolean; ed: Edit }) {
  const concerts = concertsOf(block, upcoming);
  return (
    <>
      <SectionHead block={block} ed={ed} />
      {concerts.length > 0 ? (
        <ConcertPosters concerts={concerts} variant={block.variant === 'strip' ? 'strip' : 'posters'} labels={CONCERT_LABELS} />
      ) : preview ? (
        <p className="lcs-section__empty-note">
          {block.source === 'selected' ? 'Choisissez des concerts dans la section.' : 'Aucun concert à venir pour l’instant : la section n’apparaît pas sur le site.'}
        </p>
      ) : null}
    </>
  );
}

// ── Assemblage ──────────────────────────────────────────────────────────────

export function Sections({ sections, upcomingConcerts = [], preview = false }: Props) {
  // Un seul bouton plein par page : les suivants s'affichent en lien fléché.
  const filledCta = sections.findIndex(
    (b) => b.blockType === 'cta' && Boolean(link(b.button)) && !sectionLook(b).hidden,
  );

  return (
    <>
      {preview && <PreviewScroll />}
      {sections.map((block, index) => {
        const look = sectionLook(block);
        const empty = isEmpty(block, upcomingConcerts);
        if (!preview && (look.hidden || empty)) return null;

        const ed = preview ? editFor(index) : NO_EDIT;
        let body: ReactNode;
        switch (block.blockType) {
          case 'text':
            body = <TextBody block={block} ed={ed} />;
            break;
          case 'quote':
            body = <QuoteBody block={block} ed={ed} />;
            break;
          case 'mediaText':
            body = <MediaTextBody block={block} ed={ed} />;
            break;
          case 'columns':
            body = <ColumnsBody block={block} ed={ed} />;
            break;
          case 'gallery':
            body = <GalleryBody block={block} ed={ed} />;
            break;
          case 'video':
            body = <VideoBody block={block} ed={ed} />;
            break;
          case 'cta':
            body = <CtaBody block={block} plainButton={filledCta !== -1 && index !== filledCta} ed={ed} />;
            break;
          case 'concerts':
            body = <ConcertsBody block={block} upcoming={upcomingConcerts} preview={preview} ed={ed} />;
            break;
          default:
            return null;
        }

        const name = SECTION_NAMES[block.blockType] ?? 'Section';
        return (
          <Fragment key={block.id ?? index}>
          {preview && <InsertPoint index={index} />}
          <section
            id={look.anchor}
            className={`${look.className}${preview && (look.hidden || empty) ? ' lcs-section--ghost' : ''}`}
            data-live-field={`layout__${index}`}
          >
            {preview && (look.hidden || empty) && (
              <p className="lcs-section__badge">
                {look.hidden ? `${name} — masquée, n’apparaît pas sur le site` : `${name} — à remplir, n’apparaît pas encore sur le site`}
              </p>
            )}
            {preview && <SectionToolbar index={index} count={sections.length} name={name} hidden={look.hidden} />}
            <div className="lcs-section__inner">{body}</div>
          </section>
          </Fragment>
        );
      })}
      {preview && sections.length > 0 && <InsertPoint index={sections.length} />}
    </>
  );
}
