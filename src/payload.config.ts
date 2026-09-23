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
import { Posts } from './collections/Posts';
import { PageViews } from './collections/PageViews';

import { SiteSettings } from './globals/SiteSettings';
import { HomePage } from './globals/HomePage';
import { AboutPage } from './globals/AboutPage';
import { SupportPage } from './globals/SupportPage';
import { DirectorPage } from './globals/DirectorPage';
import { ContactPage } from './globals/ContactPage';
import { MediaPage } from './globals/MediaPage';
import { MusiciansPage } from './globals/MusiciansPage';
import { MusicianForm } from './globals/MusicianForm';
import { ThemeSettings } from './globals/ThemeSettings';
import { Navigation } from './globals/Navigation';
import { unsavedChangesPlugin } from './lib/unsavedChangesPlugin';

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
        '@/components/admin/DashboardNavLink#DashboardNavLink',
        '@/components/admin/StatsNavLink#StatsNavLink',
        '@/components/admin/AnalyticsNavLink#AnalyticsNavLink',
      ],
      // Entrée « Créer une page » : se replace au bas du groupe Pages.
      afterNavLinks: ['@/components/admin/NewPageNavLink#NewPageNavLink'],
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
        // Statistiques de visite : /admin/statistiques (voir src/lib/stats.ts)
        statistiques: {
          Component: '@/components/admin/StatsView#StatsView',
          path: '/statistiques',
          exact: true,
          meta: {
            title: 'Statistiques de visite',
            description: 'Fréquentation du site : visiteurs, pages vues, provenances.',
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
        // Adresse relative : l'aperçu s'ouvre sur le même domaine que l'admin.
        // Sur un autre domaine (ex. l'adresse Vercel donnée par
        // NEXT_PUBLIC_SITE_URL alors que l'admin est sur www), le navigateur
        // isole les deux pages : ni mise à jour en direct, ni clic vers le
        // champ, ni bandeau « non enregistré ».
        const base = '';
        if (globalConfig) {
          const map: Record<string, string> = {
            'home-page': '/',
            'about-page': '/a-propos',
            'support-page': '/nous-soutenir',
            'director-page': '/directeur-artistique',
            'contact-page': '/contact',
            'media-page': '/medias',
            'musicians-page': '/musiciens',
            'musician-form': '/musiciens/contribuer',
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
          posts: `/blog/${data?.slug || ''}`,
        };
        const slug = collectionConfig?.slug || '';
        // The conductor's fiche feeds the Direction page: preview it there.
        if (slug === 'musicians' && data?.section === 'direction') {
          return `${base}/directeur-artistique`;
        }
        // A musician's fiche: preview its own detail page (slug, or id before
        // the slug exists). Nothing saved yet: fall back to the list.
        if (slug === 'musicians') {
          const handle = data?.slug || data?.id;
          return handle ? `${base}/musiciens/${handle}` : `${base}/musiciens`;
        }
        // Un·e soliste : sa page (slug, ou identifiant avant le premier enregistrement).
        if (slug === 'soloists') {
          const handle = data?.slug || data?.id;
          return handle ? `${base}/solistes/${handle}` : `${base}/`;
        }
        if (slug === 'musician-submissions') {
          const id = data?.id;
          return id ? `${base}/musiciens/apercu/${id}` : `${base}/musiciens`;
        }
        return `${base}${collectionMap[slug] || '/'}`;
      },
      globals: ['home-page', 'about-page', 'support-page', 'director-page', 'contact-page', 'media-page', 'musicians-page', 'musician-form', 'site-settings', 'navigation', 'theme-settings'],
      collections: ['concerts', 'musicians', 'media-items', 'partners', 'timeline-events', 'support-tiers', 'pages', 'musician-submissions', 'posts', 'soloists'],
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
    // Blog (articles : projets passés, entretiens, actualités)
    Posts,
    Partners,
    TimelineEvents,
    SupportTiers,
    // Bibliothèque d'images
    Media,
    // Messages reçus
    ContactSubmissions,
    MusicianSubmissions,
    // Statistiques de visite (masquée : alimentée par /api/visite, lue par /admin/statistiques)
    PageViews,
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
    MusicianForm,
    // Réglages
    SiteSettings,
    ThemeSettings,
    Navigation,
  ],

  i18n: {
    supportedLanguages: { fr },
    fallbackLanguage: 'fr',
    // La traduction française de Payload n'a qu'un libellé pour toutes les
    // collections : d'où le « Créer un(e) nouveau ou nouvelle ». On le
    // remplace par des formules justes quel que soit le genre du contenu.
    translations: {
      fr: {
        general: {
          createNew: 'Créer',
          createNewLabel: 'Créer : {{label}}',
          creatingNewLabel: 'Création : {{label}}',
        },
      },
    },
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
    // « Modifications non enregistrées » + « Annuler les modifications » sur chaque fiche.
    unsavedChangesPlugin,
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
