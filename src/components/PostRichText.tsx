import Image from 'next/image';
import {
  RichText,
  LinkJSXConverter,
  type JSXConvertersFunction,
} from '@payloadcms/richtext-lexical/react';

/**
 * Rendu du texte riche des articles du blog.
 * - Les liens internes (vers un article, un musicien, une page…) sont résolus
 *   en vraies adresses du site.
 * - Les images insérées dans le texte passent par next/image, avec leur
 *   légende (champ « Légende » de l’éditeur) sous la photo.
 */

function internalDocToHref({ linkNode }: { linkNode: any }): string {
  const doc = linkNode?.fields?.doc;
  const relationTo: string | undefined = doc?.relationTo;
  const value = doc?.value;
  const populated = value && typeof value === 'object' ? value : null;
  const slug: string | undefined = populated?.slug || undefined;
  const id = populated?.id ?? (typeof value === 'object' ? undefined : value);

  switch (relationTo) {
    case 'posts':
      return slug ? `/blog/${slug}` : '/blog';
    case 'musicians':
      return slug || id ? `/musiciens/${slug || id}` : '/musiciens';
    case 'pages':
      return slug ? `/${slug}` : '/';
    case 'concerts':
      return '/#concerts';
    case 'media':
      return populated?.url || '#';
    default:
      return '/';
  }
}

const converters: JSXConvertersFunction = ({ defaultConverters }) => ({
  ...defaultConverters,
  ...LinkJSXConverter({ internalDocToHref }),
  upload: ({ node }) => {
    const value: any = (node as any).value;
    if (!value || typeof value !== 'object' || !value.url) return null;
    const alt: string = (node as any).fields?.alt || value.alt || '';
    const caption: string =
      typeof (node as any).fields?.caption === 'string' ? (node as any).fields.caption.trim() : '';
    const isImage =
      typeof value.mimeType === 'string' ? value.mimeType.startsWith('image/') : true;

    if (!isImage) {
      return (
        <a href={value.url} rel="noopener noreferrer">
          {value.filename || value.url}
        </a>
      );
    }

    return (
      <figure className="post-figure">
        {value.width && value.height ? (
          <Image
            src={value.url}
            alt={alt}
            width={value.width}
            height={value.height}
            sizes="(max-width: 1000px) 100vw, 880px"
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value.url} alt={alt} />
        )}
        {caption && <figcaption>{caption}</figcaption>}
      </figure>
    );
  },
});

export function PostRichText({ data }: { data: unknown }) {
  if (!data || typeof data !== 'object') return null;
  return <RichText data={data as any} converters={converters} disableContainer />;
}
