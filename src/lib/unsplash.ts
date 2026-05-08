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
 * Pool of musician placeholder portraits, picked deterministically by name
 * so the same musician always shows the same image.
 */
const musicianPool = [
  u('photo-1571974599782-87624638275f', 'w=900&q=80&auto=format&fit=crop'), // violin player
  u('photo-1568952433726-3896e3881c65', 'w=900&q=80&auto=format&fit=crop'), // cellist
  u('photo-1519412666065-94acf5fa3ca9', 'w=900&q=80&auto=format&fit=crop'), // pianist hands
  u('photo-1507838153414-b4b713384a76', 'w=900&q=80&auto=format&fit=crop'), // violin closeup
  u('photo-1465147264929-0d3eef4ab43e', 'w=900&q=80&auto=format&fit=crop'), // strings close
  u('photo-1493225457124-a3eb161ffa5f', 'w=900&q=80&auto=format&fit=crop'), // conductor
  u('photo-1465410788084-b3eb22aa6dee', 'w=900&q=80&auto=format&fit=crop'), // orchestra
  u('photo-1488376986648-2512dfc6f736', 'w=900&q=80&auto=format&fit=crop'), // score
];

export function placeholderForMusician(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return musicianPool[hash % musicianPool.length];
}

/** Director placeholder — a single committed image for Loïc when no photo is uploaded */
export const directorPlaceholder = u('photo-1493225457124-a3eb161ffa5f', 'w=1400&q=80&auto=format&fit=crop');
