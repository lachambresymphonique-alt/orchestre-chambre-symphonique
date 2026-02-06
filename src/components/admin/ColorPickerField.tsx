'use client';

import { useField } from '@payloadcms/ui';
import { TextFieldClientProps } from 'payload';

export function ColorPickerField(props: TextFieldClientProps) {
  const { path, field } = props;
  const { value, setValue } = useField<string>({ path });

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
  };

  return (
    <div className="field-type text">
      <label className="field-label" htmlFor={path}>
        {field.label as string}
        {field.required && <span className="required">*</span>}
      </label>
      {field.admin?.description && (
        <div className="field-description">{field.admin.description as string}</div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px' }}>
        <input
          type="color"
          value={value || '#000000'}
          onChange={handleColorChange}
          style={{
            width: '50px',
            height: '40px',
            padding: '2px',
            border: '1px solid var(--theme-elevation-150)',
            borderRadius: '4px',
            cursor: 'pointer',
            backgroundColor: 'transparent',
          }}
        />
        <input
          type="text"
          id={path}
          value={value || ''}
          onChange={handleTextChange}
          placeholder="#RRGGBB"
          style={{
            flex: 1,
            padding: '10px 12px',
            fontSize: '14px',
            border: '1px solid var(--theme-elevation-150)',
            borderRadius: '4px',
            backgroundColor: 'var(--theme-elevation-0)',
            color: 'var(--theme-elevation-1000)',
            fontFamily: 'monospace',
          }}
        />
        <div
          style={{
            width: '80px',
            height: '40px',
            borderRadius: '4px',
            backgroundColor: value || '#000000',
            border: '1px solid var(--theme-elevation-150)',
            boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.1)',
          }}
          title={`Apercu: ${value}`}
        />
      </div>
    </div>
  );
}
