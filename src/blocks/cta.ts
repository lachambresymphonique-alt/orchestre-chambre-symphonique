import type { Block } from 'payload';
import { richTextAdmin } from '@/lib/richTextAdmin';
import { SECTION_LABEL, eyebrowField, linkGroup, sectionFields, titleField, variantField } from './settings';

/** Appel à l'action : inviter à un geste (réserver, soutenir, écrire). */
export const CtaSection: Block = {
  slug: 'cta',
  labels: { singular: 'Appel à l’action', plural: 'Appels à l’action' },
  imageURL: '/vignettes-sections/appel.svg',
  imageAltText: 'Un bandeau avec un titre et un bouton',
  admin: { group: 'Mise en avant', disableBlockName: true, components: { Label: SECTION_LABEL } },
  fields: sectionFields(
    [
      eyebrowField,
      titleField(true),
      { name: 'text', type: 'textarea', label: 'Une phrase (facultative)', admin: { ...richTextAdmin('inline') } },
      linkGroup('button', 'Bouton'),
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
