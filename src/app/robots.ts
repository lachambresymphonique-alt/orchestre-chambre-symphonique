import type { MetadataRoute } from 'next';

const BASE_URL = 'https://www.lachambresymphonique.fr';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Zones privées / non pertinentes pour l'indexation
        disallow: ['/admin', '/api', '/musiciens/apercu', '/musiciens/contribuer'],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  };
}
