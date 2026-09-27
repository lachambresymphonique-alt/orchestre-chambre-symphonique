import nodemailer from 'nodemailer';

/**
 * Envoi d'e-mails par le SMTP configuré sur Vercel (SMTP_HOST, SMTP_PORT,
 * SMTP_SECURE, SMTP_USER, SMTP_PASS, SMTP_FROM) — les mêmes variables que
 * les alertes des formulaires de contact et de recrutement.
 */

export function mailConfigured(env: NodeJS.ProcessEnv = process.env): boolean {
  return Boolean(env.SMTP_HOST);
}

/**
 * Adresse prévenue quand un musicien crée sa fiche (formulaire de
 * recrutement) ou propose de la modifier (espace membres). Choisie par
 * l'orchestre ; MUSICIANS_NOTIFY_EMAIL sur Vercel la remplace sans toucher au code.
 */
export function teamNotificationEmail(env: NodeJS.ProcessEnv = process.env): string {
  return env.MUSICIANS_NOTIFY_EMAIL || 'lachambresymphonique@gmail.com';
}

export async function sendMail({
  to,
  subject,
  text,
}: {
  to: string;
  subject: string;
  text: string;
}): Promise<void> {
  if (!mailConfigured()) throw new Error('SMTP non configuré');
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  await transporter.sendMail({
    from: `"La Chambre Symphonique" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
    to,
    subject,
    text,
  });
}
