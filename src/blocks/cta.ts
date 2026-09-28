import type { Block } from 'payload';
import { richTextAdmin } from '@/lib/richTextAdmin';
import { SECTION_LABEL, eyebrowWith, linkGroup, sectionFields, titleField, variantField } from './settings';

/** Appel à l'action : inviter à un geste (réserver, soutenir, écrire). */
export const CtaSection: Block = {
  slug: 'cta',
  labels: { singular: 'Appel à l’action', plural: 'Appels à l’action' },
  imageURL: '/vignettes-sections/appel.svg',
  imageAltText: 'Un bandeau avec un titre et un bouton',
  admin: { group: 'Mise en avant', disableBlockName: true, components: { Label: SECTION_LABEL } },
  fields: sectionFields(
    [
      eyebrowWith('La saison'),
      titleField(true, 'Venez nous *écouter*'),
      {
        name: 'text',
        type: 'textarea',
        label: 'Une phrase (facultative)',
        defaultValue: 'Les concerts de la saison sont ouverts à la réservation.',
        admin: { ...richTextAdmin('inline') },
      },
      linkGroup('button', 'Bouton', undefined, { label: 'Voir les concerts', url: '/concerts' }),
      linkGroup('secondary', 'Lien secondaire (facultatif)', 'Affiché en lien discret à côté du bouton.'),
    ],
    [
      variantField(
        [
          { label: 'Bandeau (centré)', value: 'band' },
          { label: 'En ligne (texte à gauche, lien à droite)', value: 'inline' },
        ],
        'band',
      ),
    ],
  ),
};
