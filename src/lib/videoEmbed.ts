/**
 * Convert a YouTube or Vimeo public URL into an embeddable URL.
 * Returns null when the input is missing or unrecognised.
 */
export function toEmbedUrl(url: string | undefined | null): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  // YouTube — short link (youtu.be/<id>)
  const ytShort = trimmed.match(/youtu\.be\/([\w-]{6,})/);
  if (ytShort) return `https://www.youtube.com/embed/${ytShort[1]}`;

  // YouTube — watch?v=<id>
  const ytWatch = trimmed.match(/youtube\.com\/watch\?[^#]*v=([\w-]{6,})/);
  if (ytWatch) return `https://www.youtube.com/embed/${ytWatch[1]}`;

  // YouTube — already an embed URL
  if (/youtube\.com\/embed\//.test(trimmed)) return trimmed;

  // Vimeo — vimeo.com/<id>
  const vimeo = trimmed.match(/vimeo\.com\/(\d{4,})/);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;

  // Vimeo — already a player URL
  if (/player\.vimeo\.com\/video\//.test(trimmed)) return trimmed;

  return null;
}
