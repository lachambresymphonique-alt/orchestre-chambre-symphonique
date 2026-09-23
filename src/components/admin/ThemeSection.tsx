'use client';

import './admin-theme-settings.css';

type Props = {
  field?: { label?: unknown; admin?: { description?: unknown } };
};

/** Intertitre d'un onglet d'« Apparence du site » (champ « ui »). */
export function ThemeSection({ field }: Props) {
  const label = typeof field?.label === 'string' ? field.label : '';
  const description = typeof field?.admin?.description === 'string' ? field.admin.description : '';
  return (
    <div className="lcs-tsection">
      <h3 className="lcs-tsection__title">{label}</h3>
      {description && <p className="lcs-tsection__desc">{description}</p>}
    </div>
  );
}

export default ThemeSection;
