import { buildConfig } from 'payload';
import { postgresAdapter } from '@payloadcms/db-postgres';
import { lexicalEditor } from '@payloadcms/richtext-lexical';
import { vercelBlobStorage } from '@payloadcms/storage-vercel-blob';
import { fr } from '@payloadcms/translations/languages/fr';
import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

import { Users } from './collections/Users';
import { Media } from './collections/Media';
import { Concerts } from './collections/Concerts';
import { Musicians } from './collections/Musicians';
import { MediaItems } from './collections/MediaItems';
import { Partners } from './collections/Partners';
import { TimelineEvents } from './collections/TimelineEvents';
import { SupportTiers } from './collections/SupportTiers';
import { Pages } from './collections/Pages';

import { SiteSettings } from './globals/SiteSettings';
import { HomePage } from './globals/HomePage';
import { AboutPage } from './globals/AboutPage';
import { SupportPage } from './globals/SupportPage';

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
    meta: {
      titleSuffix: ' — La Chambre Symphonique',
      description: 'Panneau d\'administration du site de La Chambre Symphonique',
    },
    avatar: 'default',
    livePreview: {
      url: ({ data, collectionConfig, globalConfig }) => {
        const base = process.env.NEXT_PUBLIC_SITE_URL || '';
        if (globalConfig) {
          const map: Record<string, string> = {
            'home-page': '/',
            'about-page': '/a-propos',
            'support-page': '/nous-soutenir',
            'site-settings': '/contact',
          };
          return `${base}${map[globalConfig.slug] || '/'}`;
        }
        const collectionMap: Record<string, string> = {
          concerts: '/',
          musicians: '/musiciens',
          'media-items': '/medias',
          partners: '/',
          'timeline-events': '/a-propos',
          'support-tiers': '/nous-soutenir',
          pages: `/${data?.slug || ''}`,
        };
        const slug = collectionConfig?.slug || '';
        return `${base}${collectionMap[slug] || '/'}`;
      },
      globals: ['home-page', 'about-page', 'support-page', 'site-settings'],
      collections: ['concerts', 'musicians', 'media-items', 'partners', 'timeline-events', 'support-tiers', 'pages'],
      breakpoints: [
        { label: 'Mobile', name: 'mobile', width: 375, height: 667 },
        { label: 'Tablette', name: 'tablet', width: 768, height: 1024 },
        { label: 'Bureau', name: 'desktop', width: 1440, height: 900 },
      ],
    },
  },

  collections: [
    Users,
    Media,
    Concerts,
    Musicians,
    MediaItems,
    Partners,
    TimelineEvents,
    SupportTiers,
    Pages,
  ],

  globals: [SiteSettings, HomePage, AboutPage, SupportPage],

  i18n: {
    supportedLanguages: { fr },
    fallbackLanguage: 'fr',
  },

  editor: lexicalEditor(),

  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL || '',
      ssl: !!process.env.DATABASE_URL,
    },
  }),

  plugins: [
    ...(process.env.BLOB_READ_WRITE_TOKEN
      ? [
          vercelBlobStorage({
            enabled: true,
            collections: { media: true },
            token: process.env.BLOB_READ_WRITE_TOKEN,
          }),
        ]
      : []),
  ],

  sharp,

  secret: process.env.PAYLOAD_SECRET || 'dev-secret-change-in-production',

  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
});
