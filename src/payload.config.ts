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
import { ContactSubmissions } from './collections/ContactSubmissions';
import { MusicianSubmissions } from './collections/MusicianSubmissions';
import { Soloists } from './collections/Soloists';

import { SiteSettings } from './globals/SiteSettings';
import { HomePage } from './globals/HomePage';
import { AboutPage } from './globals/AboutPage';
import { SupportPage } from './globals/SupportPage';
import { DirectorPage } from './globals/DirectorPage';
import { ContactPage } from './globals/ContactPage';
import { MediaPage } from './globals/MediaPage';
import { MusiciansPage } from './globals/MusiciansPage';
import { ThemeSettings } from './globals/ThemeSettings';
import { Navigation } from './globals/Navigation';

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
    components: {
      graphics: {
        Icon: '@/components/admin/AdminIcon#AdminIcon',
        Logo: '@/components/admin/AdminLogo#AdminLogo',
      },
      // Barre du haut : « Voir le site » juste avant la photo du compte.
      actions: ['@/components/admin/HeaderSiteLink#HeaderSiteLink'],
      beforeNavLinks: [
        '@/components/admin/AnalyticsNavLink#AnalyticsNavLink',
      ],
      beforeDashboard: ['@/components/admin/BeforeDashboard#BeforeDashboard'],
      views: {
        // Google Analytics : /admin/google-analytics (voir src/lib/googleAnalytics.ts)
        googleAnalytics: {
          Component: '@/components/admin/AnalyticsView#AnalyticsView',
          path: '/google-analytics',
          exact: true,
          meta: {
            title: 'Google Analytics',
            description: 'Fréquentation du site mesurée par Google Analytics.',
          },
        },
      },
    },
    // Tableau de bord : nos cartes d'effectifs (ContentOverview) remplacent les
    // cartes de collections par défaut de Payload, qui ne montraient qu'un
    // titre et un bouton « + » par collection.
    dashboard: {
      widgets: [
        {
          slug: 'content-overview',
          label: 'Contenu du site',
          ComponentPath: '@/components/admin/ContentOverview#ContentOverview',
          minWidth: 'full',
        },
      ],
      defaultLayout: [{ widgetSlug: 'content-overview', width: 'full' }],
    },
    livePreview: {
      url: ({ data, collectionConfig, globalConfig }) => {
        const base = process.env.NEXT_PUBLIC_SITE_URL || '';
        if (globalConfig) {
          const map: Record<string, string> = {
            'home-page': '/',
            'about-page': '/a-propos',
            'support-page': '/nous-soutenir',
            'director-page': '/directeur-artistique',
            'contact-page': '/contact',
            'media-page': '/medias',
            'musicians-page': '/musiciens',
            'site-settings': '/contact',
            'theme-settings': '/',
            navigation: '/',
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
        // The conductor's fiche feeds the Direction page: preview it there.
        if (slug === 'musicians' && data?.section === 'direction') {
          return `${base}/directeur-artistique`;
        }
        if (slug === 'musician-submissions') {
          const id = data?.id;
          return id ? `${base}/musiciens/apercu/${id}` : `${base}/musiciens`;
        }
        return `${base}${collectionMap[slug] || '/'}`;
      },
      globals: ['home-page', 'about-page', 'support-page', 'director-page', 'contact-page', 'media-page', 'musicians-page', 'site-settings', 'navigation', 'theme-settings'],
      collections: ['concerts', 'musicians', 'media-items', 'partners', 'timeline-events', 'support-tiers', 'pages', 'musician-submissions'],
      breakpoints: [
        { label: 'Mobile', name: 'mobile', width: 375, height: 667 },
        { label: 'Tablette', name: 'tablet', width: 768, height: 1024 },
        { label: 'Bureau', name: 'desktop', width: 1440, height: 900 },
      ],
    },
  },

  collections: [
    // Pages
    Pages,
    // Contenu
    Concerts,
    Musicians,
    Soloists,
    MediaItems,
    Partners,
    TimelineEvents,
    SupportTiers,
    // Bibliothèque d'images
    Media,
    // Messages reçus
    ContactSubmissions,
    MusicianSubmissions,
    // Réglages
    Users,
  ],

  globals: [
    // Pages
    HomePage,
    AboutPage,
    SupportPage,
    DirectorPage,
    ContactPage,
    MediaPage,
    MusiciansPage,
    // Réglages
    SiteSettings,
    ThemeSettings,
    Navigation,
  ],

  i18n: {
    supportedLanguages: { fr },
    fallbackLanguage: 'fr',
  },

  editor: lexicalEditor(),

  db: postgresAdapter({
    push: true,
    pool: (() => {
      // Strip `sslmode` from the connection string so pg-connection-string
      // doesn't emit the v3 deprecation warning, then configure ssl explicitly.
      const raw = process.env.DATABASE_URL || '';
      let cleaned = raw;
      if (raw) {
        try {
          const url = new URL(raw);
          url.searchParams.delete('sslmode');
          cleaned = url.toString();
        } catch {
          cleaned = raw;
        }
      }
      return {
        connectionString: cleaned,
        ssl: cleaned ? { rejectUnauthorized: false } : false,
      };
    })(),
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
