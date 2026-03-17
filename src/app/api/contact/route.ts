import { NextRequest, NextResponse } from 'next/server';
import { getPayloadClient } from '@/lib/payload';
import nodemailer from 'nodemailer';

const SUBJECT_LABELS: Record<string, string> = {
  info: "Demande d'information",
  reservation: 'Réservation / Billetterie',
  mecenat: 'Mécénat / Partenariat',
  presse: 'Presse / Médias',
  programmation: 'Programmation / Booking',
  benevolat: 'Bénévolat',
  autre: 'Autre',
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, subject, message } = body;

    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: 'Tous les champs sont requis.' },
        { status: 400 },
      );
    }

    // Save to database via Payload
    const payload = await getPayloadClient();
    await payload.create({
      collection: 'contact-submissions' as any,
      data: { name, email, subject, message },
    });

    // Send email notification if SMTP is configured
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
      const subjectLabel = SUBJECT_LABELS[subject] || subject;

      await transporter.sendMail({
        from: `"La Chambre Symphonique" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
        to,
        replyTo: email,
        subject: `[Contact] ${subjectLabel} — ${name}`,
        text: [
          `Nom : ${name}`,
          `E-mail : ${email}`,
          `Objet : ${subjectLabel}`,
          '',
          message,
        ].join('\n'),
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Contact form error:', error);
    return NextResponse.json(
      { error: 'Une erreur est survenue. Veuillez réessayer.' },
      { status: 500 },
    );
  }
}
