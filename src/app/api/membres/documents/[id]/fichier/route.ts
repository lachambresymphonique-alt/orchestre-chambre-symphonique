import { NextResponse } from 'next/server';
import { getPayloadClient } from '@/lib/payload';
import { getMemberSession } from '@/lib/memberSession';
import { requestIsAdmin } from '@/lib/profileChanges';
import { canSeeDocument, documentExpiry } from '@/lib/pupitres';
import { downloadUrl, r2Config } from '@/lib/r2';

/**
 * Téléchargement d'un document de l'espace membres : vérifie que la personne
 * y a droit (administrateur, ou membre destinataire tant que le document est
 * visible), puis redirige vers un lien signé valable 5 minutes. Un document
 * inaccessible répond 404, qu'il existe ou non.
 */

const notFound = () => NextResponse.json({ error: 'Document introuvable.' }, { status: 404 });

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const payload = await getPayloadClient();

  let doc: any;
  try {
    doc = await payload.findByID({ collection: 'member-documents' as any, id, depth: 1, overrideAccess: true });
  } catch {
    return notFound();
  }
  if (!doc?.fileKey) return notFound();

  if (!(await requestIsAdmin(payload))) {
    const session = await getMemberSession();
    if (!session) return NextResponse.json({ error: 'Connectez-vous à l’espace membres.' }, { status: 401 });
    const expiry = documentExpiry(doc);
    if (expiry && expiry.getTime() < Date.now()) return notFound();
    if (!canSeeDocument(session.musician, doc.recipients)) return notFound();
  }

  const config = r2Config();
  if (!config) {
    return NextResponse.json({ error: 'Le stockage des documents n’est pas configuré.' }, { status: 503 });
  }
  const res = NextResponse.redirect(downloadUrl(config, doc.fileKey, doc.fileName || 'document'), 302);
  res.headers.set('Cache-Control', 'no-store');
  return res;
}
