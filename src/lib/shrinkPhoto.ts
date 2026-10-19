/**
 * Réduit une photo dans le navigateur avant de l'envoyer (formulaires publics).
 *
 * Vercel refuse tout envoi de plus de 4,5 Mo vers une fonction du site : une
 * photo de téléphone ou d'appareil (souvent 5 à 15 Mo) n'arrivait jamais.
 * Ramenée à 1920 px de large en JPEG, elle pèse quelques centaines de Ko, sans
 * perte visible : le site ne l'affiche jamais plus grande.
 *
 * Navigateur seulement. En cas d'échec (format illisible…), le fichier
 * d'origine est rendu tel quel.
 */

/** Au-delà, l'envoi échouerait : marge sous la limite de 4,5 Mo de Vercel. */
export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

const MAX_WIDTH = 1920;
/** Une photo déjà légère et pas trop large est envoyée sans être réencodée. */
const KEEP_AS_IS_BYTES = 1.5 * 1024 * 1024;

export async function shrinkPhoto(file: File): Promise<File> {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return file;
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
    const scale = Math.min(1, MAX_WIDTH / bitmap.width);
    if (scale === 1 && file.size <= KEEP_AS_IS_BYTES) {
      bitmap.close();
      return file;
    }
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      bitmap.close();
      return file;
    }
    // Fond blanc : la transparence d'un PNG n'existe pas en JPEG.
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.85));
    if (!blob || blob.size >= file.size) return file;
    const name = `${file.name.replace(/\.[^.]+$/, '') || 'photo'}.jpg`;
    return new File([blob], name, { type: 'image/jpeg', lastModified: file.lastModified });
  } catch {
    return file;
  }
}
