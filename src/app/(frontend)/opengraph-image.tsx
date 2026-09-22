import { ImageResponse } from 'next/og';

// Image de partage social (Open Graph + Twitter) générée dynamiquement.
// Reprend la palette de marque : near-black chaud, or « bougie », crème.
export const alt = 'La Chambre Symphonique — Orchestre fondé en 2017';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '80px 90px',
          background: 'linear-gradient(135deg, #141110 0%, #241c17 55%, #17120f 100%)',
          position: 'relative',
        }}
      >
        {/* Halo « bougie » */}
        <div
          style={{
            position: 'absolute',
            top: -190,
            right: -140,
            width: 640,
            height: 640,
            display: 'flex',
            background:
              'radial-gradient(circle, rgba(227,169,77,0.30) 0%, rgba(227,169,77,0) 70%)',
          }}
        />

        {/* Eyebrow */}
        <div
          style={{
            display: 'flex',
            color: '#e3a94d',
            fontSize: 26,
            letterSpacing: 6,
            textTransform: 'uppercase',
            fontWeight: 600,
          }}
        >
          Orchestre · Fondé en 2017
        </div>

        {/* Filet doré */}
        <div
          style={{
            width: 96,
            height: 2,
            background: '#e3a94d',
            opacity: 0.6,
            margin: '30px 0',
            display: 'flex',
          }}
        />

        {/* Titre */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            color: '#f3ece0',
            fontSize: 98,
            fontWeight: 700,
            lineHeight: 1.02,
            letterSpacing: -1,
          }}
        >
          <span>La Chambre</span>
          <span style={{ fontStyle: 'italic' }}>Symphonique</span>
        </div>

        {/* Sous-titre */}
        <div
          style={{
            display: 'flex',
            marginTop: 34,
            color: '#cdb9a6',
            fontSize: 30,
            maxWidth: 840,
            lineHeight: 1.35,
          }}
        >
          Plus de 80 musiciens réunis par la passion du répertoire symphonique —
          Bourgogne &amp; Rhône-Alpes.
        </div>
      </div>
    ),
    { ...size },
  );
}
