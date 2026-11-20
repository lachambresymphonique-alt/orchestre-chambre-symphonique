/**
 * E-mails envoyés aux musiciens par le site, en tutoyant comme le formulaire
 * de recrutement : remerciement à l'envoi de la fiche, puis « ta page est en
 * ligne » quand l'équipe la publie. Côté serveur uniquement.
 */
import type { CollectionAfterChangeHook } from 'payload';
import { mailConfigured, sendMail } from './mail';
import { musicianContact } from './musicianContact';
import { publicUrl } from './siteUrl';

const SIGNATURE = '— La Chambre Symphonique';

export function thanksEmailText(firstName: string): string {
  return [
    `Bonjour${firstName ? ` ${firstName}` : ''},`,
    '',
    'Merci ! Ta fiche musicien est bien arrivée.',
    'L’équipe s’occupe de valider ton profil : tu recevras un e-mail dès que ta page sera en ligne.',
    '',
    SIGNATURE,
  ].join('\n');
}

export function onlineEmailText(firstName: string, pageUrl: string): string {
  return [
    `Bonjour${firstName ? ` ${firstName}` : ''},`,
    '',
    'Bonne nouvelle : ta page est en ligne sur le site de La Chambre Symphonique !',
    pageUrl,
    '',
    'N’hésite pas à la partager.',
    '',
    SIGNATURE,
  ].join('\n');
}

/** Remerciement à l'envoi du formulaire de recrutement. Ne lève jamais d'erreur. */
export async function sendThanksEmail(to: string, firstName: string): Promise<void> {
  if (!mailConfigured() || !to) return;
  try {
    await sendMail({ to, subject: 'Merci pour ta fiche — La Chambre Symphonique', text: thanksEmailText(firstName) });
  } catch (err) {
    console.error('Remerciement fiche musicien non envoyé :', err);
  }
}

/**
 * Fiche musicien qui passe « En ligne » : le musicien reçoit le lien de sa page.
 * Seulement au passage à « En ligne » (pas à chaque enregistrement), et
 * seulement si l'on connaît son adresse (dernière fiche reçue à son nom, ou
 * accès membre). Un échec d'envoi ne bloque pas l'enregistrement.
 */
export const notifyMusicianOnline: CollectionAfterChangeHook = async ({ doc, previousDoc, operation, req }) => {
  const nowOnline = doc?.status === 'published';
  const wasOnline = operation === 'update' && previousDoc?.status === 'published';
  if (!nowOnline || wasOnline || !doc?.slug || !mailConfigured()) return doc;
  try {
    const contact = await musicianContact(req.payload as never, doc);
    if (!contact.email) return doc;
    await sendMail({
      to: contact.email,
      subject: 'Ta page est en ligne — La Chambre Symphonique',
      text: onlineEmailText(contact.firstName, publicUrl(`/musiciens/${doc.slug}`)),
    });
  } catch (err) {
    console.error('E-mail « page en ligne » non envoyé :', err);
  }
  return doc;
};
