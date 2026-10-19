/**
 * Description d'image proposée à partir du nom du fichier envoyé, quand ce nom
 * dit quelque chose (« Affiche concerts avril 2026.jpg » → « Affiche concerts
 * avril 2026 »). Rien pour les noms d'appareil ou de messagerie (DSC07709,
 * IMG_1234, WhatsApp Image 2026-07-15…, identifiants) : mieux vaut un champ
 * vide qu'une description qui n'en est pas une.
 */

const MEANINGLESS = [
  /^(dsc|dscn|dscf|img|pxl|mvimg|gopr|dji|sam|photo|image|picture|scan|capture|screenshot)[\s_-]*\d/i,
  /^capture d.?[ée]cran/i,
  /^(untitled|sans titre|image|photo)\s*\d*$/i,
  /^[0-9a-f]{12,}$/i, // empreinte
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-/i, // identifiant unique
  /^[\d\s_-]+n?$/i, // identifiants numériques (Facebook : 470474506_6126…_n)
];

export function altFromFilename(filename: string): string {
  let text = filename
    .replace(/\.[a-z0-9]{2,5}$/i, '')
    // « WhatsApp Image 2026-07-15 at 14.53.26 » : seul ce qui suit compte.
    .replace(/^whatsapp(\s+(image|video|vid[ée]o))?(\s+\d{4}-\d{2}-\d{2}(\s+(at|à)\s+[\d.]+)?)?\s*/i, '')
    .trim();
  if (!text || MEANINGLESS.some((re) => re.test(text))) return '';
  text = text
    .replace(/_+/g, ' ')
    .replace(/^\d{4}[\s-]\d{2}([\s-]\d{2})?[\s-]+/, '') // date en tête (2026-04-…, 2026 02 01 …)
    .replace(/\b\d{5,}\b/g, '') // numéros d'export d'appareil
    .replace(/\b(lr\s+)?edit\b/gi, '')
    .replace(/(\p{L})\s*-\s*\d{1,2}$/u, '$1') // « Affiche Dole - 1 » : numéro de copie
    .replace(/[\s-]+$/, '')
    .replace(/\s+/g, ' ')
    .trim();
  const letters = text.match(/\p{L}/gu) ?? [];
  if (letters.length < 3) return '';
  // Nom tout en majuscules : remis en minuscules, première lettre exceptée.
  if (letters.filter((c) => c === c.toUpperCase()).length / letters.length > 0.7) text = text.toLowerCase();
  return text.charAt(0).toUpperCase() + text.slice(1);
}
