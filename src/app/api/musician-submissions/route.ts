import { NextRequest, NextResponse } from 'next/server';
import { getPayloadClient } from '@/lib/payload';
import nodemailer from 'nodemailer';

const ALLOWED_SECTIONS = new Set(['direction', 'cordes', 'vents', 'claviers']);
const ALLOWED_PHOTO_MIMETYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
]);
const MAX_PHOTO_BYTES = 10 * 1024 * 1024; // 10 MB

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const get = (key: string): string => {
      const value = formData.get(key);
      return typeof value === 'string' ? value.trim() : '';
    };

    const firstName = get('firstName');
    const lastName = get('lastName');
    const email = get('email');
    const role = get('role');
    if (!firstName || !lastName || !email || !role) {
      return NextResponse.json(
        { error: 'Le prénom, le nom, l\'e-mail et le rôle sont obligatoires.' },
        { status: 400 },
      );
    }

    const fullName = `${firstName} ${lastName}`.trim();
    const rawInstagram = get('instagram');
    const instagram = rawInstagram
      ? rawInstagram.replace(/^https?:\/\/(www\.)?instagram\.com\//i, '@').replace(/^([^@])/, '@$1')
      : undefined;

    const submissionData: Record<string, unknown> = {
      firstName,
      lastName,
      name: fullName,
      email,
      phone: get('phone') || undefined,
      instagram,
      role,
      instrument: get('instrument') || undefined,
      bio: get('bio') || undefined,
      inspiringSymphony: get('inspiringSymphony') || undefined,
      favoriteWork: get('favoriteWork') || undefined,
      favoriteComposer: get('favoriteComposer') || undefined,
      formation: get('formation') || undefined,
      concours: get('concours') || undefined,
      videoUrl: get('videoUrl') || undefined,
      status: 'nouveau',
    };
    const section = get('section');
    if (section && ALLOWED_SECTIONS.has(section)) {
      submissionData.section = section;
    }

    const payload = await getPayloadClient();

    // Optional photo upload
    const photoFile = formData.get('photo');
    if (photoFile && photoFile instanceof File && photoFile.size > 0) {
      if (!ALLOWED_PHOTO_MIMETYPES.has(photoFile.type)) {
        return NextResponse.json(
          { error: 'Format de photo non accepté. Utilisez JPG, PNG ou WebP.' },
          { status: 400 },
        );
      }
      if (photoFile.size > MAX_PHOTO_BYTES) {
        return NextResponse.json(
          { error: 'Photo trop volumineuse (max 10 Mo).' },
          { status: 400 },
        );
      }

      const buffer = Buffer.from(await photoFile.arrayBuffer());
      const media = await payload.create({
        collection: 'media' as any,
        data: { alt: `Photo — ${fullName}` } as any,
        file: {
          name: photoFile.name || 'photo.jpg',
          data: buffer,
          mimetype: photoFile.type,
          size: photoFile.size,
        },
      });
      submissionData.photo = (media as any).id;
    }

    await payload.create({
      collection: 'musician-submissions' as any,
      data: submissionData,
    });

    if (process.env.SMTP_HOST) {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      const to = process.env.CONTACT_EMAIL || process.env.SMTP_USER;
      await transporter.sendMail({
        from: `"La Chambre Symphonique" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
        to,
        replyTo: email,
        subject: `[Fiche musicien] ${fullName}`,
        text: [
          `Nouvelle fiche reçue via le formulaire musicien :`,
          ``,
          `Prénom : ${firstName}`,
          `Nom : ${lastName}`,
          `E-mail : ${email}`,
          submissionData.phone ? `Téléphone : ${submissionData.phone}` : null,
          submissionData.instagram ? `Instagram : ${submissionData.instagram}` : null,
          `Rôle : ${role}`,
          submissionData.instrument ? `Instrument : ${submissionData.instrument}` : null,
          submissionData.section ? `Section : ${submissionData.section}` : null,
          submissionData.photo ? `Photo : oui (téléversée)` : `Photo : non fournie`,
          ``,
          submissionData.bio ? `Biographie :\n${submissionData.bio}` : null,
          ``,
          submissionData.inspiringSymphony ? `Symphonie qui a donné envie : ${submissionData.inspiringSymphony}` : null,
          submissionData.favoriteWork ? `Œuvre préférée : ${submissionData.favoriteWork}` : null,
          submissionData.favoriteComposer ? `Compositeur préféré : ${submissionData.favoriteComposer}` : null,
          ``,
          submissionData.formation ? `Formation :\n${submissionData.formation}` : null,
          ``,
          submissionData.concours ? `Concours :\n${submissionData.concours}` : null,
          ``,
          submissionData.videoUrl ? `Vidéo : ${submissionData.videoUrl}` : null,
        ]
          .filter(Boolean)
          .join('\n'),
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Musician submission error:', error);
    return NextResponse.json(
      { error: 'Une erreur est survenue. Veuillez réessayer.' },
      { status: 500 },
    );
  }
}
