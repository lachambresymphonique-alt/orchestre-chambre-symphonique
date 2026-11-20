import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { getPayloadClient } from '@/lib/payload';
import { isAdminUser } from '@/lib/access';
import { normalizeEmail } from '@/lib/memberInvitations';
import { musicianContact } from '@/lib/musicianContact';
import { PUPITRE_SECTIONS } from '@/lib/musicianForm';
import { inviteToOrchestraManager, omAccessStatus, omConfigured } from '@/lib/orchestraManager';

/**
 * Accès à l'espace musicien d'Orchestra Manager, depuis la fiche d'un musicien
 * dans l'admin (src/components/admin/OrchestraManagerButton.tsx).
 *
 * GET  ?musicianId=… : liaison configurée ?, fiche concernée (pupitres
 *      seulement), adresse suggérée et état de l'accès dans Orchestra Manager.
 * POST { musicianId, email } : invitation demandée à Orchestra Manager et
 *      envoyée au musicien ; le lien est aussi rendu, pour le transmettre.
 *
 * Réservé aux administrateurs.
 */

type Payload = Awaited<ReturnType<typeof getPayloadClient>>;

async function requireAdmin(payload: Payload): Promise<boolean> {
  try {
    const { user } = await payload.auth({ headers: await headers() });
    return isAdminUser(user);
  } catch {
    return false;
  }
}

async function findMusician(payload: Payload, id: unknown) {
  if (typeof id !== 'string' && typeof id !== 'number') return null;
  try {
    return (await payload.findByID({ collection: 'musicians' as any, id, depth: 0 })) as any;
  } catch {
    return null;
  }
}

const isPupitre = (section: unknown) => (PUPITRE_SECTIONS as readonly string[]).includes(String(section));

export async function GET(req: NextRequest) {
  const payload = await getPayloadClient();
  if (!(await requireAdmin(payload))) return NextResponse.json({ error: 'Authentification requise.' }, { status: 401 });
  const musician = await findMusician(payload, req.nextUrl.searchParams.get('musicianId'));
  if (!musician) return NextResponse.json({ error: 'Fiche introuvable.' }, { status: 404 });

  if (!omConfigured() || !isPupitre(musician.section)) {
    return NextResponse.json({ configured: omConfigured(), eligible: false });
  }
  const contact = await musicianContact(payload, musician);
  let access = null;
  let error: string | null = null;
  if (contact.email) {
    try {
      access = await omAccessStatus(contact.email);
    } catch (err) {
      error = (err as Error).message;
    }
  }
  return NextResponse.json({ configured: true, eligible: true, suggestedEmail: contact.email, access, error });
}

export async function POST(req: NextRequest) {
  const payload = await getPayloadClient();
  if (!(await requireAdmin(payload))) return NextResponse.json({ error: 'Authentification requise.' }, { status: 401 });
  if (!omConfigured()) return NextResponse.json({ error: 'Liaison avec Orchestra Manager non configurée.' }, { status: 503 });

  let body: { musicianId?: unknown; email?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Requête invalide.' }, { status: 400 });
  }
  const email = normalizeEmail(body.email);
  if (!email) return NextResponse.json({ error: 'Adresse e-mail invalide.' }, { status: 400 });
  const musician = await findMusician(payload, body.musicianId);
  if (!musician) return NextResponse.json({ error: 'Fiche introuvable.' }, { status: 404 });
  if (!isPupitre(musician.section)) {
    return NextResponse.json({ error: 'Seules les fiches des pupitres (cordes, vents, claviers) reçoivent un espace musicien.' }, { status: 400 });
  }

  const contact = await musicianContact(payload, musician);
  try {
    const result = await inviteToOrchestraManager({
      firstName: contact.firstName,
      lastName: contact.lastName,
      // L'adresse saisie fait foi : l'équipe a pu corriger celle de la fiche reçue.
      email,
      phone: contact.email === email ? contact.phone : null,
    });
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 502 });
  }
}
