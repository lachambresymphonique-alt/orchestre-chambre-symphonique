'use client';

import { MusicianSubmissionForm } from '@/components/MusicianSubmissionForm';
import { RefreshOnSave } from '@/components/RefreshOnSave';
import { useLiveGlobal } from '@/hooks/useLiveDocument';
import { useLivePreviewSync } from '@/hooks/useLivePreviewSync';
import { resolveMusicianForm } from '@/lib/musicianForm';

/**
 * Page « Compléter ma fiche musicien », rendue côté client pour l'aperçu en
 * direct du global « Formulaire musiciens » : questions, textes et ordre
 * suivent la saisie dans l'admin, avant d'enregistrer.
 */
export function ContributeLive({
  doc: initialDoc,
  formToken,
  turnstileSiteKey,
}: {
  doc: Record<string, any> | null;
  formToken: string;
  turnstileSiteKey: string | null;
}) {
  const doc = useLiveGlobal('musician-form', initialDoc, 0);
  useLivePreviewSync(null);
  const form = resolveMusicianForm(doc as any);

  return (
    <div className="contribute-page">
      <RefreshOnSave />
      <span className="contribute-halo" aria-hidden />

      <header className="contribute-hero contribute-hero--simple" data-live-field="header">
        <p className="eyebrow eyebrow--gold">{form.header.eyebrow}</p>
        <h1 className="contribute-hero__title">
          <em>{form.header.titleItalic}</em>
          <br />
          {form.header.titleRest}
        </h1>
      </header>

      <section className="contribute-form-wrap">
        <MusicianSubmissionForm formToken={formToken} turnstileSiteKey={turnstileSiteKey} form={form} />
      </section>
    </div>
  );
}
