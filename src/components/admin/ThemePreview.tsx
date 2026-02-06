'use client';

import { useFormFields } from '@payloadcms/ui';

export function ThemePreview() {
  const mode = useFormFields(([fields]) => fields.mode?.value as string);
  const primary = useFormFields(([fields]) => fields['colors.primary']?.value as string);
  const primaryLight = useFormFields(([fields]) => fields['colors.primaryLight']?.value as string);
  const primaryDark = useFormFields(([fields]) => fields['colors.primaryDark']?.value as string);
  const accent = useFormFields(([fields]) => fields['colors.accent']?.value as string);

  const lightBg = useFormFields(([fields]) => fields['lightTheme.background']?.value as string);
  const lightBgAlt = useFormFields(([fields]) => fields['lightTheme.backgroundAlt']?.value as string);
  const lightText = useFormFields(([fields]) => fields['lightTheme.text']?.value as string);

  const darkBg = useFormFields(([fields]) => fields['darkTheme.background']?.value as string);
  const darkBgAlt = useFormFields(([fields]) => fields['darkTheme.backgroundAlt']?.value as string);
  const darkText = useFormFields(([fields]) => fields['darkTheme.text']?.value as string);

  const headingFont = useFormFields(([fields]) => fields['typography.headingFont']?.value as string);
  const bodyFont = useFormFields(([fields]) => fields['typography.bodyFont']?.value as string);

  const fontFamilies: Record<string, string> = {
    cormorant: "'Cormorant Garamond', Georgia, serif",
    playfair: "'Playfair Display', Georgia, serif",
    baskerville: "'Libre Baskerville', Georgia, serif",
    montserrat: "'Montserrat', sans-serif",
    opensans: "'Open Sans', sans-serif",
    lato: "'Lato', sans-serif",
    sourcesans: "'Source Sans 3', sans-serif",
  };

  const isLight = mode !== 'dark';
  const bg = isLight ? (lightBg || '#FDFBF7') : (darkBg || '#1A1A2E');
  const bgAlt = isLight ? (lightBgAlt || '#F5F0E8') : (darkBgAlt || '#16213E');
  const text = isLight ? (lightText || '#2C2C2C') : (darkText || '#F0EDE6');

  return (
    <div style={{ marginBottom: '24px' }}>
      <div
        style={{
          fontSize: '13px',
          fontWeight: 500,
          marginBottom: '12px',
          color: 'var(--theme-elevation-800)',
        }}
      >
        Apercu du theme ({mode === 'dark' ? 'Sombre' : mode === 'hybrid' ? 'Hybride' : 'Clair'})
      </div>

      <div
        style={{
          borderRadius: '12px',
          overflow: 'hidden',
          border: '1px solid var(--theme-elevation-150)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        }}
      >
        {/* Header preview */}
        <div
          style={{
            backgroundColor: bg,
            padding: '16px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: `1px solid ${bgAlt}`,
          }}
        >
          <div
            style={{
              fontFamily: fontFamilies[headingFont] || fontFamilies.cormorant,
              fontSize: '18px',
              fontWeight: 500,
              color: text,
            }}
          >
            La Chambre Symphonique
          </div>
          <div style={{ display: 'flex', gap: '16px' }}>
            {['Accueil', 'A propos', 'Contact'].map((item) => (
              <span
                key={item}
                style={{
                  fontFamily: fontFamilies[bodyFont] || fontFamilies.montserrat,
                  fontSize: '12px',
                  color: text,
                  opacity: 0.8,
                }}
              >
                {item}
              </span>
            ))}
          </div>
        </div>

        {/* Hero preview */}
        <div
          style={{
            backgroundColor: mode === 'light' ? (darkBg || '#1A1A2E') : bg,
            padding: '40px 24px',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              color: primary || '#C9A84C',
              fontSize: '10px',
              textTransform: 'uppercase',
              letterSpacing: '0.2em',
              marginBottom: '8px',
              fontFamily: fontFamilies[bodyFont] || fontFamilies.montserrat,
            }}
          >
            Orchestre symphonique
          </div>
          <div
            style={{
              fontFamily: fontFamilies[headingFont] || fontFamilies.cormorant,
              fontSize: '28px',
              color: mode === 'light' ? (darkText || '#F0EDE6') : text,
              marginBottom: '16px',
            }}
          >
            La Chambre <em>Symphonique</em>
          </div>
          <button
            style={{
              backgroundColor: primary || '#C9A84C',
              color: '#fff',
              border: 'none',
              padding: '10px 24px',
              borderRadius: '4px',
              fontFamily: fontFamilies[bodyFont] || fontFamilies.montserrat,
              fontSize: '12px',
              fontWeight: 500,
              cursor: 'default',
            }}
          >
            Prochains concerts
          </button>
        </div>

        {/* Content preview */}
        <div
          style={{
            backgroundColor: bg,
            padding: '24px',
          }}
        >
          <div
            style={{
              fontFamily: fontFamilies[headingFont] || fontFamilies.cormorant,
              fontSize: '20px',
              color: text,
              marginBottom: '8px',
            }}
          >
            Notre histoire
          </div>
          <div
            style={{
              fontFamily: fontFamilies[bodyFont] || fontFamilies.montserrat,
              fontSize: '13px',
              color: text,
              opacity: 0.7,
              lineHeight: 1.6,
            }}
          >
            Plus de 80 musiciens reunis par la passion du repertoire symphonique...
          </div>
        </div>

        {/* Alt section */}
        <div
          style={{
            backgroundColor: bgAlt,
            padding: '16px 24px',
            display: 'flex',
            gap: '12px',
          }}
        >
          {[primary, primaryLight, primaryDark, accent].map((color, i) => (
            <div
              key={i}
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '8px',
                backgroundColor: color || '#ccc',
                border: '1px solid rgba(0,0,0,0.1)',
              }}
              title={color}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
