import { NextRequest, NextResponse } from 'next/server';
import { getPayloadClient } from '@/lib/payload';
import { siteLinkRefusal } from '@/lib/siteLink';
import { findMusicianByEmail } from '@/lib/musicianContact';
import { PROFILE_FIELDS } from '@/lib/profileFields';
import { profileFormState, submitProfileProposal } from '@/lib/profileProposals';
import { isMusicianPublic } from '@/lib/musicianVisibility';
import { SITE_URL, publicUrl } from '@/lib/siteUrl';

/**
 * Page publique d'un musicien, modifiée depuis son espace Orchestra Manager.
 * OM appelle ces routes avec la clé partagée (lib/siteLink.ts) et l'adresse
 * e-mail du compte connecté ; la fiche est retrouvée par cette adresse.
 *
 * GET  ?email=…   champs modifiables, valeurs de départ, état de la dernière proposition
 * POST multipart  email + champs (+ photo) → proposition à relire par l'équipe
 *                 (Messages reçus → Modifications proposées), comme depuis l'espace membres.
 */

const NOT_FOUND =
  'Aucune page musicien sur le site n’est reliée à votre adresse e-mail. Demandez à l’équipe de la relier, ou envoyez d’abord votre fiche par le formulaire musicien.';

const absolute = (url: string | null) => (url && url.startsWith('/') ? `${SITE_URL}${url}` : url);

export async function GET(req: NextRequest) {
  const refusal = siteLinkRefusal(req.headers.get('authorization'));
  if (refusal) return NextResponse.json({ error: refusal.error }, { status: refusal.status });
  const email = req.nextUrl.searchParams.get('email') ?? '';
  const payload = await getPayloadClient();
  const musician = await findMusicianByEmail(payload, email);
  if (!musician) return NextResponse.json({ error: NOT_FOUND }, { status: 404 });

  const state = await profileFormState(payload, musician);
  return NextResponse.json({
    data: {
      musician: {
        name: musician.name,
        online: isMusicianPublic(musician),
        url: musician.slug ? publicUrl(`/musiciens/${musician.slug}`) : null,
      },
      fields: PROFILE_FIELDS,
      ...state,
      photoUrl: absolute(state.photoUrl),
    },
  });
}

export async function POST(req: NextRequest) {
  const refusal = siteLinkRefusal(req.headers.get('authorization'));
  if (refusal) return NextResponse.json({ error: refusal.error }, { status: refusal.status });
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: 'Envoi illisible. Si une photo est jointe, elle doit faire moins de 4 Mo.' }, { status: 400 });
  }
  const email = form.get('email');
  const payload = await getPayloadClient();
  const musician = typeof email === 'string' ? await findMusicianByEmail(payload, email) : null;
  if (!musician) return NextResponse.json({ error: NOT_FOUND }, { status: 404 });

  const result = await submitProfileProposal({
    payload,
    musicianId: musician.id,
    form,
    accountId: null,
    adminOrigin: SITE_URL,
  });
  return NextResponse.json(result.body, { status: result.status });
}
