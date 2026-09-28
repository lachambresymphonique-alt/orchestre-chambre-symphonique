import { NextRequest, NextResponse } from 'next/server';
import { getPayloadClient } from '@/lib/payload';
import { requestIsAdmin } from '@/lib/profileChanges';
import { newObjectKey, presignUrl, r2Config } from '@/lib/r2';
import { DOCUMENT_TYPES, MAX_DOCUMENT_BYTES } from '@/lib/documentTypes';

/**
 * Lien d'envoi d'un document vers le stockage privé, pour l'admin
 * (DocumentFileField). Le navigateur envoie le fichier directement au
 * stockage : il ne passe pas par Vercel, qui plafonne les requêtes à 4,5 Mo.
 */

export async function POST(req: NextRequest) {
  const payload = await getPayloadClient();
  if (!(await requestIsAdmin(payload))) {
    return NextResponse.json({ error: 'Authentification requise.' }, { status: 401 });
  }
  const config = r2Config();
  if (!config) {
    return NextResponse.json(
      { error: 'Le stockage des documents n’est pas encore configuré (clés Cloudflare R2 absentes).' },
      { status: 503 },
    );
  }

  let body: { fileName?: unknown; contentType?: unknown; size?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Requête invalide.' }, { status: 400 });
  }
  const fileName = typeof body.fileName === 'string' ? body.fileName.trim().slice(0, 200) : '';
  const contentType = typeof body.contentType === 'string' ? body.contentType : '';
  const size = Number(body.size);
  if (!fileName) return NextResponse.json({ error: 'Nom de fichier manquant.' }, { status: 400 });
  if (!DOCUMENT_TYPES[contentType]) {
    return NextResponse.json({ error: 'Format non accepté : PDF, JPG, PNG ou MP3.' }, { status: 400 });
  }
  if (!Number.isFinite(size) || size <= 0 || size > MAX_DOCUMENT_BYTES) {
    return NextResponse.json({ error: 'Fichier trop lourd : 200 Mo au plus.' }, { status: 400 });
  }

  const key = newObjectKey(fileName);
  return NextResponse.json({ key, uploadUrl: presignUrl(config, 'PUT', key, 15 * 60) });
}
