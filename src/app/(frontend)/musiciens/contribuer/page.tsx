import type { Metadata } from 'next';
import { cache } from 'react';
import { ContributeLive } from './ContributeLive';
import { getFormSecret, issueFormToken } from '@/lib/antispam';
import { getPayloadClient } from '@/lib/payload';
import { resolveMusicianForm } from '@/lib/musicianForm';

/**
 * Page « Compléter ma fiche musicien ».
 *
 * Les questions posées se règlent dans l'admin (Pages → Formulaire musiciens).
 * Tant que ce global n'a pas été enregistré — ou si sa lecture échoue — le
 * formulaire d'origine s'affiche à l'identique.
 */
/** Global brut (null s'il n'a jamais été enregistré) : l'aperçu en direct le complète. */
const getMusicianFormDoc = cache(async (): Promise<Record<string, any> | null> => {
  try {
    const payload = await getPayloadClient();
    return (await payload.findGlobal({ slug: 'musician-form' as any })) as any;
  } catch {
    return null;
  }
});

const getMusicianForm = cache(async () => resolveMusicianForm(await getMusicianFormDoc()));

export async function generateMetadata(): Promise<Metadata> {
  const form = await getMusicianForm();
  return {
    title: form.seo.metaTitle,
    description: form.seo.metaDescription,
    robots: { index: false, follow: false },
  };
}

export default async function MusicianContributePage() {
  const doc = await getMusicianFormDoc();
  // Jeton anti-robot : émis à chaque rendu (page dynamique), vérifié par /api/musician-submissions.
  const formToken = issueFormToken(getFormSecret());
  // Captcha Cloudflare Turnstile : mêmes clés que le formulaire de contact ; absent tant qu'elles ne sont pas configurées.
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || null;

  return <ContributeLive doc={doc} formToken={formToken} turnstileSiteKey={turnstileSiteKey} />;
}
