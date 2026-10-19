import type { Config, Plugin } from 'payload';

/**
 * À placer après vercelBlobStorage({ clientUploads: true }) : remplace le
 * composant d'envoi du module par celui du site, qui donne un nom unique à
 * chaque fichier (voir src/components/admin/BlobUploadHandler.tsx).
 */
const MODULE_HANDLER = '@payloadcms/storage-vercel-blob/client#VercelBlobClientUploadHandler';
const SITE_HANDLER = '@/components/admin/BlobUploadHandler#BlobUploadHandler';

export const uniqueClientUploadNames: Plugin = (config: Config): Config => {
  const providers = config.admin?.components?.providers ?? [];
  if (!providers.some((p) => typeof p === 'object' && p?.path === MODULE_HANDLER)) {
    throw new Error('blobClientUploads : composant d’envoi de @payloadcms/storage-vercel-blob introuvable (clientUploads activé ?).');
  }
  return {
    ...config,
    admin: {
      ...config.admin,
      components: {
        ...config.admin?.components,
        providers: providers.map((p) => (typeof p === 'object' && p?.path === MODULE_HANDLER ? { ...p, path: SITE_HANDLER } : p)),
      },
    },
  };
};
