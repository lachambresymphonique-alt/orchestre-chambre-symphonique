'use client';

import { useConfig, useEffectEvent, useUploadHandlers } from '@payloadcms/ui';
import { upload } from '@vercel/blob/client';
import { formatAdminURL } from 'payload/shared';
import { Fragment, useEffect, type ReactNode } from 'react';

/**
 * Envoi des images de l'admin directement du navigateur vers Vercel Blob.
 *
 * Vercel refuse tout envoi de plus de 4,5 Mo vers une fonction : une photo
 * d'appareil n'arrivait jamais jusqu'à Payload (« Failed to fetch »). Ici le
 * fichier part vers Blob ; Payload le relit ensuite depuis Blob pour le réduire
 * à 1920 px et créer ses formats (voir Media.ts).
 *
 * Variante du composant du module @payloadcms/storage-vercel-blob, qui envoie
 * sous le nom d'origine : avec `addRandomSuffix: false`, une photo nommée comme
 * une photo existante (deux « DSC07709.JPG ») remplacerait l'ancienne en
 * silence. Le nom reçoit donc un suffixe unique avant l'envoi.
 * Branché à la place de celui du module par src/lib/blobClientUploads.ts.
 */

/** « DSC07709.JPG » → « DSC07709-m2k8x1q4.JPG » */
export function uniqueFilename(name: string): string {
  const dot = name.lastIndexOf('.');
  const stem = dot > 0 ? name.slice(0, dot) : name;
  const ext = dot > 0 ? name.slice(dot) : '';
  const suffix = Date.now().toString(36) + Math.random().toString(36).slice(2, 4);
  return `${stem}-${suffix}${ext}`;
}

type Props = {
  children?: ReactNode;
  collectionSlug: string;
  enabled?: boolean;
  prefix?: string;
  serverHandlerPath: string;
};

export function BlobUploadHandler({ children, collectionSlug, enabled, prefix = '', serverHandlerPath }: Props) {
  const { setUploadHandler } = useUploadHandlers();
  const {
    config: {
      routes: { api: apiRoute },
      serverURL,
    },
  } = useConfig();

  const register = useEffectEvent(() => {
    if (!enabled) return;
    setUploadHandler({
      collectionSlug: collectionSlug as never,
      handler: async ({ file, updateFilename }) => {
        const filename = uniqueFilename(file.name);
        await upload(`${prefix}${filename}`, file, {
          access: 'public',
          clientPayload: collectionSlug,
          contentType: file.type,
          handleUploadUrl: formatAdminURL({ apiRoute, path: serverHandlerPath as `/${string}`, serverURL }),
        });
        updateFilename(filename);
        return { prefix };
      },
    });
  });

  useEffect(() => {
    register();
  }, []);

  return <Fragment>{children}</Fragment>;
}
