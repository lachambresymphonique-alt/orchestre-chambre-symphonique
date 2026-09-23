import type { MetadataRoute } from 'next';

const BASE_URL = 'https://www.lachambresymphonique.fr';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        // Les fichiers de la médiathèque (affiches, photos) sont servis sous /api :
        // les robots doivent pouvoir les lire (images Google, partages sociaux).
        // La règle la plus longue l'emporte : /api/media/file/ passe devant /api.
        allow: ['/', '/api/media/file/'],
        // Zones privées / non pertinentes pour l'indexation
        disallow: ['/admin', '/api', '/musiciens/apercu', '/musiciens/contribuer'],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  };
}
