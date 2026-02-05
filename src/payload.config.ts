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
