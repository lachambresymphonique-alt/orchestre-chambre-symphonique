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
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.public.blob.vercel-storage.com',
      },
      {
        protocol: 'https',
        hostname: '**.blob.vercel-storage.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      // Miniatures dérivées des liens vidéo (page Médias)
      { protocol: 'https', hostname: 'i.ytimg.com' },
      { protocol: 'https', hostname: 'img.youtube.com' },
      { protocol: 'https', hostname: 'i.vimeocdn.com' },
    ],
  },
};

export default withPayload(nextConfig);
