'use client';

import './admin-sections.css';
import {
  useConfig,
  useDocumentInfo,
  useForm,
  useFormBackgroundProcessing,
  useFormFields,
  useFormModified,
  useFormProcessing,
} from '@payloadcms/ui';
import { timeOf } from './PageStatus';

/**
 * « Enregistrer » d'une page libre, à la place du « Enregistrer le brouillon »
 * de Payload, qui restait grisé sans dire pourquoi quand tout était déjà
 * enregistré. Le bouton annonce son état :
 *
 * - « ✓ Enregistré à 14:33 » : rien de nouveau, l'enregistrement automatique
 *   a tout gardé (il s'active dès qu'on modifie quelque chose) ;
 * - « Enregistrer » : il y a des modifications, on peut les enregistrer tout
 *   de suite sans attendre (⌘S aussi) ;
 * - « Enregistrement… » pendant l'enregistrement.
 *
 * Il enregistre un brouillon, comme celui de Payload : rien n'est publié.
 */
export function SaveDraftButton() {
  const { id, collectionSlug, lastUpdateTime, setUnpublishedVersionCount } = useDocumentInfo();
  const { submit } = useForm();
  const modified = useFormModified();
  const saving = useFormBackgroundProcessing();
  const processing = useFormProcessing();
  const updatedAt = useFormFields(([fields]) => fields.updatedAt?.value);
  const {
    config: {
      routes: { api },
    },
  } = useConfig();

  const busy = saving || processing;
  const savedAt = timeOf(updatedAt) ?? timeOf(lastUpdateTime);

  const save = async () => {
    if (!modified || busy || !collectionSlug) return;
    await submit({
      action: `${api}/${collectionSlug}${id ? `/${id}` : ''}?depth=0&fallback-locale=null&draft=true`,
      method: id ? 'PATCH' : 'POST',
      overrides: { _status: 'draft' },
      skipValidation: true,
      disableSuccessStatus: true,
    });
    setUnpublishedVersionCount((count) => count + 1);
  };

  if (busy) {
    return (
      <span className="lcs-save is-busy" aria-live="polite">
        Enregistrement…
      </span>
    );
  }

  if (!modified) {
    return (
      <span
        className="lcs-save is-saved"
        aria-live="polite"
        title="Tout est enregistré : chaque modification est gardée automatiquement en brouillon. Le bouton « Enregistrer » revient dès que vous modifiez quelque chose."
      >
        ✓ {savedAt ? `Enregistré à ${savedAt}` : 'Enregistré'}
      </span>
    );
  }

  return (
    <button
      type="button"
      id="action-save-draft"
      className="lcs-save is-pending"
      onClick={() => void save()}
      title="Enregistrer tout de suite en brouillon (⌘S). Sinon, l’enregistrement se fait tout seul dans un instant."
    >
      Enregistrer
    </button>
  );
}

export default SaveDraftButton;
