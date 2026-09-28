import { NextResponse } from 'next/server';
import { getPayloadClient } from '@/lib/payload';
import { requestIsAdmin } from '@/lib/profileChanges';
import { mailConfigured, sendMail } from '@/lib/mail';

/** Refus d'une demande d'accès : rien n'est ouvert ; la personne est prévenue si l'e-mail est configuré. */
export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const payload = await getPayloadClient();
  if (!(await requestIsAdmin(payload))) {
    return NextResponse.json({ error: 'Authentification requise.' }, { status: 401 });
  }
  const { id } = await ctx.params;
  let request: any;
  try {
    request = await payload.findByID({ collection: 'member-requests' as any, id, depth: 0, overrideAccess: true });
  } catch {
    return NextResponse.json({ error: 'Demande introuvable.' }, { status: 404 });
  }
  if (request.status !== 'nouvelle') {
    return NextResponse.json({ error: 'Cette demande a déjà été traitée.' }, { status: 409 });
  }

  await payload.update({
    collection: 'member-requests' as any,
    id,
    data: { status: 'refusee', decidedAt: new Date().toISOString() } as any,
    overrideAccess: true,
  });

  if (mailConfigured()) {
    try {
      await sendMail({
        to: request.email,
        subject: 'Votre demande d’accès — La Chambre Symphonique',
        text: [
          `Bonjour ${request.firstName},`,
          '',
          'Votre demande d’accès à l’espace membres n’a pas été acceptée. S’il s’agit d’une erreur, écrivez-nous en répondant à ce message.',
          '',
          '— La Chambre Symphonique',
        ].join('\n'),
      });
    } catch (err) {
      console.error('E-mail de refus de demande :', err);
    }
  }
  return NextResponse.json({ success: true });
}
