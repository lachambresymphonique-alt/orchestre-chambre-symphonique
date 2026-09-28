/**
 * Unsplash placeholder images — staging only.
 * Replace with real photos uploaded to Payload Media collection.
 */

const u = (id: string, q: string = 'w=1600&q=80&auto=format&fit=crop') =>
  `https://images.unsplash.com/${id}?${q}`;

export const stockImages = {
  // Concert hall, conductor, orchestra wide
  heroOrchestra:    u('photo-1465847899084-d164df4dedc6', 'w=2000&q=80&auto=format&fit=crop'),
  orchestraWide:    u('photo-1465410788084-b3eb22aa6dee', 'w=2000&q=80&auto=format&fit=crop'),
  concertHall:      u('photo-1465252005003-83d1d3b5b13c', 'w=2000&q=80&auto=format&fit=crop'),
  conductor:        u('photo-1493225457124-a3eb161ffa5f', 'w=1600&q=80&auto=format&fit=crop'),

  // Strings — violin, cello
  violin:           u('photo-1507838153414-b4b713384a76', 'w=1600&q=80&auto=format&fit=crop'),
  violinPlayer:     u('photo-1571974599782-87624638275f', 'w=1400&q=80&auto=format&fit=crop'),
  cellist:          u('photo-1568952433726-3896e3881c65', 'w=1400&q=80&auto=format&fit=crop'),
  stringsClose:     u('photo-1465147264929-0d3eef4ab43e', 'w=1400&q=80&auto=format&fit=crop'),

  // Piano / keys
  pianistHands:     u('photo-1519412666065-94acf5fa3ca9', 'w=1600&q=80&auto=format&fit=crop'),

  // Sheet music / score
  score:            u('photo-1488376986648-2512dfc6f736', 'w=1400&q=80&auto=format&fit=crop'),
};

/**
 * Visuel d'un musicien sans photo : ses initiales, sur fond sombre, dans une
 * image SVG embarquée (aucune requête, rien qui puisse casser). Remplace les
 * photos d'illustration Unsplash, qui ne montraient pas la personne et dont
 * plusieurs ont disparu du service.
 */
export function placeholderForMusician(seed: string): string {
  const words = (seed || '').trim().split(/[\s-]+/).filter(Boolean);
  const letters = ((words[0]?.[0] ?? '') + (words.length > 1 ? words[words.length - 1][0] : ''))
    .toUpperCase()
    .replace(/[^\p{L}]/gu, '');
  const svg =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500">' +
    '<rect width="400" height="500" fill="#15110e"/>' +
    '<circle cx="200" cy="235" r="118" fill="none" stroke="#c9a45c" stroke-opacity="0.35" stroke-width="2"/>' +
    '<text x="200" y="270" text-anchor="middle" font-family="Georgia, \'Times New Roman\', serif" font-style="italic" font-size="104" fill="#d8b26a">' +
    (letters || '♪') +
    '</text></svg>';
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/** Director placeholder — a single committed image for Loïc when no photo is uploaded */
export const directorPlaceholder = u('photo-1493225457124-a3eb161ffa5f', 'w=1400&q=80&auto=format&fit=crop');
