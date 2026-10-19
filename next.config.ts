import { withPayload } from '@payloadcms/next/withPayload';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  async redirects() {
    return [
      // Le blog de l'orchestre vit sous /blog ; /journal, son ancien nom, y renvoie.
      { source: '/journal', destination: '/blog', permanent: true },
      { source: '/journal/:slug', destination: '/blog/:slug', permanent: true },
      // Le formulaire des musiciens a déménagé sous /recrutement : les liens
      // déjà envoyés continuent d'aboutir.
      { source: '/musiciens/contribuer', destination: '/recrutement/musicien', permanent: true },
    ];
  },
  images: {
    // Vercel facture une transformation par variante (image × largeur ×
    // qualité × format) à chaque fois que son cache expire : peu de
    // variantes, gardées longtemps.
    // 31 jours. Avec les 60 s par défaut, le cache suivait celui de la
    // source : 2 h pour les miniatures YouTube, retransformables toutes les 2 h.
    minimumCacheTTL: 2678400,
    formats: ['image/webp'],
    // 5 largeurs au lieu de 16 : de la vignette (256) à la pleine largeur
    // sur écran haute densité (1920).
    deviceSizes: [640, 1080, 1440, 1920],
    imageSizes: [256],
    // Une seule qualité : les URL /_next/image à une autre qualité sont refusées.
    qualities: [75],
    // Seules les sources du site peuvent être transformées : toute autre URL
    // passée à /_next/image est refusée, sinon n'importe qui pourrait faire
    // optimiser ses propres images sur le quota du site. `search: ''` refuse
    // aussi les paramètres ajoutés, qui créeraient autant de variantes.
    // Les photos de la médiathèque passent par Payload (/api/media/file/…).
    localPatterns: [{ pathname: '/api/media/file/**', search: '' }],
    remotePatterns: [
      // Store Vercel Blob du site (« lcs-blob-public »), pour une adresse
      // directe ; les pages utilisent aujourd'hui /api/media/file/….
      { protocol: 'https', hostname: '1ldpmsfyd0bqeu5s.public.blob.vercel-storage.com', pathname: '/**', search: '' },
      // Miniatures dérivées des liens vidéo (page Médias)
      { protocol: 'https', hostname: 'i.ytimg.com', pathname: '/vi/**', search: '' },
      { protocol: 'https', hostname: 'i.vimeocdn.com', pathname: '/video/**' },
    ],
  },
};

export default withPayload(nextConfig);
