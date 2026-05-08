import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { getPayloadClient } from '@/lib/payload';

const VALID_SECTIONS = new Set(['direction', 'cordes', 'vents', 'claviers']);

const slugify = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

function lines(text: unknown): { item: string }[] | undefined {
  if (typeof text !== 'string' || !text.trim()) return undefined;
  const items = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((item) => ({ item }));
  return items.length > 0 ? items : undefined;
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;

  const payload = await getPayloadClient();

  // Auth: require an admin session via Payload's request handling.
  let user: any = null;
  try {
    const reqHeaders = await headers();
    const authResult = await payload.auth({ headers: reqHeaders });
    user = authResult?.user;
  } catch {
    user = null;
  }
  if (!user) {
    return NextResponse.json({ error: 'Authentification requise.' }, { status: 401 });
  }

  let submission: any;
  try {
    submission = await payload.findByID({
      collection: 'musician-submissions' as any,
      id,
      depth: 1,
    });
  } catch {
    return NextResponse.json({ error: 'Fiche introuvable.' }, { status: 404 });
  }
  if (!submission) {
    return NextResponse.json({ error: 'Fiche introuvable.' }, { status: 404 });
  }

  const fullName: string =
    (typeof submission.name === 'string' && submission.name.trim()) ||
    [submission.firstName, submission.lastName].filter(Boolean).join(' ').trim();

  if (!fullName) {
    return NextResponse.json(
      { error: 'La fiche doit contenir au moins un prénom et un nom.' },
      { status: 400 },
    );
  }

  if (!submission.role) {
    return NextResponse.json(
      { error: 'La fiche doit contenir un rôle.' },
      { status: 400 },
    );
  }

  // If already promoted, try to find the existing musician with the same name
  // and short-circuit instead of creating a duplicate.
  if (submission.status === 'traite') {
    try {
      const existing = await payload.find({
        collection: 'musicians' as any,
        where: { name: { equals: fullName } } as any,
        limit: 1,
        depth: 0,
      });
      const existingId = existing.docs?.[0]?.id;
      return NextResponse.json(
        {
          message: 'Cette fiche a déjà été recopiée dans Musiciens.',
          musicianId: existingId,
          redirectTo: existingId ? `/admin/collections/musicians/${existingId}` : null,
        },
        { status: 409 },
      );
    } catch {
      return NextResponse.json(
        { message: 'Cette fiche a déjà été recopiée dans Musiciens.' },
        { status: 409 },
      );
    }
  }

  const section: string = VALID_SECTIONS.has(submission.section)
    ? submission.section
    : 'cordes';

  // Compute a unique slug — append -2, -3 if collisions.
  const baseSlug = slugify(fullName) || 'musicien';
  let slug = baseSlug;
  for (let i = 2; i < 100; i++) {
    const existing = await payload.find({
      collection: 'musicians' as any,
      where: { slug: { equals: slug } } as any,
      limit: 1,
      depth: 0,
    });
    if (!existing.docs?.length) break;
    slug = `${baseSlug}-${i}`;
  }

  // Highest order in the section + 1, so new musicians land at the end.
  const lastInSection = await payload.find({
    collection: 'musicians' as any,
    where: { section: { equals: section } } as any,
    sort: '-order' as any,
    limit: 1,
    depth: 0,
  });
  const nextOrder =
    lastInSection.docs?.[0]?.order != null ? Number(lastInSection.docs[0].order) + 1 : 0;

  const photoId =
    submission.photo && typeof submission.photo === 'object' && 'id' in submission.photo
      ? (submission.photo as any).id
      : submission.photo || undefined;

  const data: Record<string, unknown> = {
    name: fullName,
    slug,
    role: submission.role,
    instrument: submission.instrument || undefined,
    section,
    photo: photoId,
    instagram: submission.instagram || undefined,
    tagline: submission.tagline || undefined,
    bio: submission.bio || undefined,
    inspiringSymphony: submission.inspiringSymphony || undefined,
    favoriteWork: submission.favoriteWork || undefined,
    favoriteComposer: submission.favoriteComposer || undefined,
    formation: lines(submission.formation),
    concours: lines(submission.concours),
    videoUrl: submission.videoUrl || undefined,
    quote: submission.quote || undefined,
    order: nextOrder,
  };

  let musician: any;
  try {
    musician = await payload.create({
      collection: 'musicians' as any,
      data: data as any,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Création du musicien impossible.' },
      { status: 500 },
    );
  }

  try {
    await payload.update({
      collection: 'musician-submissions' as any,
      id,
      data: { status: 'traite' } as any,
    });
  } catch {
    // Non-blocking: musician was created, status update is best-effort.
  }

  return NextResponse.json({
    success: true,
    musicianId: musician.id,
    slug: musician.slug,
    redirectTo: `/admin/collections/musicians/${musician.id}`,
  });
}
