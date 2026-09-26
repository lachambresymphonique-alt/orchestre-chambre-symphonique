'use client';

import './admin-timeline.css';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ConfirmationModal, toast, useListQuery, useModal } from '@payloadcms/ui';

const modalSlug = 'lcs-timeline-sort-by-year';

/**
 * Au-dessus de la liste Chronologie : comment déplacer une date, et
 * « Trier par année » pour tout remettre dans l'ordre chronologique.
 * Le glisser-déposer de Payload ne marche que si la liste suit l'ordre du
 * site (colonne de poignées) : sinon, un bouton l'y ramène.
 */
export function TimelineOrderBar() {
  const router = useRouter();
  const { query, handleSortChange } = useListQuery();
  const { openModal, closeModal } = useModal();
  const [pending, setPending] = useState(false);

  const sort = typeof query?.sort === 'string' ? query.sort : '_order';
  const followsSite = sort === '_order' || sort === '';

  const showSiteOrder = async () => {
    await handleSortChange?.('_order');
  };

  const sortByYear = async () => {
    closeModal(modalSlug);
    setPending(true);
    try {
      const res = await fetch('/api/timeline-events/sort-by-year', { method: 'POST', credentials: 'include' });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || `Erreur ${res.status}`);
      if (!followsSite) await showSiteOrder();
      router.refresh();
      toast.success('Chronologie triée par année.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Le tri n’a pas pu être appliqué.');
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="lcs-timeline-bar">
      <p className="lcs-timeline-bar__help">
        {followsSite ? (
          <>
            Pour déplacer une date, attrapez la poignée <span className="lcs-timeline-bar__grip" aria-hidden>⠿</span> au
            début de sa ligne et faites-la glisser : la page À propos suit cet ordre.
          </>
        ) : (
          <>La liste est triée par une autre colonne : pour déplacer les dates, revenez à l’ordre du site.</>
        )}
      </p>
      <div className="lcs-timeline-bar__actions">
        {!followsSite && (
          <button type="button" className="lcs-timeline-bar__btn" onClick={showSiteOrder}>
            Revenir à l’ordre du site
          </button>
        )}
        <button
          type="button"
          className="lcs-timeline-bar__btn lcs-timeline-bar__btn--primary"
          onClick={() => openModal(modalSlug)}
          disabled={pending}
        >
          {pending ? 'Tri en cours…' : 'Trier par année'}
        </button>
      </div>

      <ConfirmationModal
        modalSlug={modalSlug}
        heading="Trier la chronologie par année ?"
        body="Les dates seront rangées de la plus ancienne à la plus récente, sur le site comme dans cette liste. L’ordre actuel sera remplacé ; vous pourrez toujours déplacer une date ensuite."
        confirmLabel="Trier par année"
        cancelLabel="Annuler"
        confirmingLabel="Tri en cours…"
        onConfirm={sortByYear}
      />
    </div>
  );
}
