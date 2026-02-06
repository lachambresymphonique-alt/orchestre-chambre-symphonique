'use client';

import { useField } from '@payloadcms/ui';
import { SelectFieldClientProps } from 'payload';

const fontMap: Record<string, { name: string; family: string; sample: string }> = {
  cormorant: {
    name: 'Cormorant Garamond',
    family: "'Cormorant Garamond', Georgia, serif",
    sample: 'La Chambre Symphonique',
  },
  playfair: {
    name: 'Playfair Display',
    family: "'Playfair Display', Georgia, serif",
    sample: 'La Chambre Symphonique',
  },
  baskerville: {
    name: 'Libre Baskerville',
    family: "'Libre Baskerville', Georgia, serif",
    sample: 'La Chambre Symphonique',
  },
  montserrat: {
    name: 'Montserrat',
    family: "'Montserrat', 'Helvetica Neue', sans-serif",
    sample: 'Un orchestre au service de la musique',
  },
  opensans: {
    name: 'Open Sans',
    family: "'Open Sans', 'Helvetica Neue', sans-serif",
    sample: 'Un orchestre au service de la musique',
  },
  lato: {
    name: 'Lato',
    family: "'Lato', 'Helvetica Neue', sans-serif",
    sample: 'Un orchestre au service de la musique',
  },
  sourcesans: {
    name: 'Source Sans Pro',
    family: "'Source Sans 3', 'Helvetica Neue', sans-serif",
    sample: 'Un orchestre au service de la musique',
  },
};

export function FontPreviewField(props: SelectFieldClientProps) {
  const { path, field } = props;
  const { value, setValue } = useField<string>({ path });

  const options = (field.options as { label: string; value: string }[]) || [];
  const selectedFont = fontMap[value as string] || fontMap.cormorant;
  const isHeading = path.includes('headingFont');

  return (
    <div className="field-type select">
      <label className="field-label" htmlFor={path}>
        {field.label as string}
        {field.required && <span className="required">*</span>}
      </label>
      {field.admin?.description && (
        <div className="field-description">{field.admin.description as string}</div>
      )}
      <select
        id={path}
        value={value || ''}
        onChange={(e) => setValue(e.target.value)}
        style={{
          width: '100%',
          padding: '10px 12px',
          fontSize: '14px',
          border: '1px solid var(--theme-elevation-150)',
          borderRadius: '4px',
          backgroundColor: 'var(--theme-elevation-0)',
          color: 'var(--theme-elevation-1000)',
          marginTop: '8px',
        }}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {/* Font Preview */}
      <div
        style={{
          marginTop: '16px',
          padding: '20px',
          backgroundColor: 'var(--theme-elevation-50)',
          borderRadius: '8px',
          border: '1px solid var(--theme-elevation-100)',
        }}
      >
        <div
          style={{
            fontSize: '11px',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            color: 'var(--theme-elevation-500)',
            marginBottom: '12px',
          }}
        >
          Apercu
        </div>
        <div
          style={{
            fontFamily: selectedFont.family,
            fontSize: isHeading ? '32px' : '16px',
            fontWeight: isHeading ? 400 : 300,
            lineHeight: isHeading ? 1.2 : 1.6,
            color: 'var(--theme-elevation-1000)',
          }}
        >
          {selectedFont.sample}
        </div>
        <div
          style={{
            marginTop: '8px',
            fontSize: '12px',
            color: 'var(--theme-elevation-400)',
            fontFamily: 'monospace',
          }}
        >
          {selectedFont.family}
        </div>
      </div>
    </div>
  );
}
