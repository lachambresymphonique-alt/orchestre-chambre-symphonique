import { NextRequest, NextResponse } from 'next/server';
import { getPayloadClient } from '@/lib/payload';
import { getMemberSession } from '@/lib/memberSession';
import { submitProfileProposal } from '@/lib/profileProposals';

/**
 * Proposition de modification de fiche, envoyée depuis /espace-membres/fiche
 * (bureau et direction). La logique est dans lib/profileProposals.ts, partagée
 * avec l'espace musicien d'Orchestra Manager.
 */

function fail(error: string, status = 400) {
  return NextResponse.json({ error }, { status });
}

export async function POST(req: NextRequest) {
  // Le cookie de session est SameSite=Lax ; on refuse en plus tout envoi venu d'un autre site.
  const origin = req.headers.get('origin');
  if (origin && origin !== req.nextUrl.origin) return fail('Requête refusée.', 403);

  const session = await getMemberSession();
  if (!session) return fail('Votre session a expiré. Reconnectez-vous pour envoyer vos modifications.', 401);

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return fail('Requête invalide. Si vous avez joint une photo, vérifiez qu’elle fait moins de 4 Mo.');
  }

  const result = await submitProfileProposal({
    payload: await getPayloadClient(),
    musicianId: session.musician.id,
    form,
    accountId: session.account.id,
    adminOrigin: req.nextUrl.origin,
  });
  return NextResponse.json(result.body, { status: result.status });
}
