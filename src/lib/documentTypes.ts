/**
 * Formats et taille acceptés pour les documents de l'espace membres. Lu par
 * la route d'envoi (contrôle) et par le champ de l'admin (sélecteur de fichier).
 */

export const DOCUMENT_TYPES: Record<string, string> = {
  'application/pdf': 'PDF',
  'image/jpeg': 'JPG',
  'image/png': 'PNG',
  'audio/mpeg': 'MP3',
};

export const MAX_DOCUMENT_BYTES = 200 * 1024 * 1024;

/** Taille lisible : « 3,4 Mo ». */
export function formatBytes(bytes: number | null | undefined): string {
  if (!bytes || bytes <= 0) return '';
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} Ko`;
  return `${(bytes / (1024 * 1024)).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} Mo`;
}
