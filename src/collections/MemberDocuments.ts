import type { CollectionConfig } from 'payload';
import { DOCUMENT_GRACE_DAYS, RECIPIENT_OPTIONS } from '@/lib/pupitres';
import { deleteObject, r2Config } from '@/lib/r2';

/**
 * Partitions et documents de l'espace membres (/espace-membres/documents).
 *
 * Le fichier vit dans un stockage privé (Cloudflare R2, src/lib/r2.ts), pas
 * dans la médiathèque, dont les fichiers sont publics. L'admin l'envoie
 * directement au stockage (DocumentFileField) ; un membre ne le télécharge
 * qu'après vérification de ses droits (/api/membres/documents/:id/fichier).
 *
 * Qui voit quoi : src/lib/pupitres.ts (canSeeDocument, documentExpiry).
 */

async function removeFile(key: unknown) {
  const config = r2Config();
  if (!config || typeof key !== 'string' || !key) return;
  try {
    await deleteObject(config, key);
  } catch (err) {
    console.error('Document membre : fichier non supprimé du stockage', err);
  }
}

export const MemberDocuments: CollectionConfig = {
  slug: 'member-documents',
  labels: { singular: 'Document membres', plural: 'Documents membres' },
  admin: {
    useAsTitle: 'title',
    group: 'Espace membres',
    description:
      'Partitions et documents réservés aux membres, dans un stockage privé. Chacun ne voit que ce qui est adressé à son pupitre, à son groupe ou à tous ; la direction voit tout.',
    defaultColumns: ['title', 'concert', 'recipients', 'fileName', 'updatedAt'],
  },
  defaultSort: '-updatedAt',
  hooks: {
    // Un fichier remplacé ou un document supprimé libère sa place dans le stockage.
    afterChange: [
      async ({ doc, previousDoc }) => {
        if (previousDoc?.fileKey && previousDoc.fileKey !== doc.fileKey) await removeFile(previousDoc.fileKey);
        return doc;
      },
    ],
    afterDelete: [
      async ({ doc }) => {
        await removeFile(doc?.fileKey);
      },
    ],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      label: 'Titre',
      admin: { description: 'Par exemple : « Brahms, Symphonie n° 4 — Violons 1 ».' },
    },
    {
      name: 'file',
      type: 'ui',
      admin: { components: { Field: '@/components/admin/DocumentFileField#DocumentFileField' } },
    },
    {
      name: 'recipients',
      type: 'select',
      hasMany: true,
      required: true,
      label: 'Destinataires',
      admin: {
        description:
          'Un ou plusieurs pupitres, l’équipe technique, le bureau, ou tous les membres. La direction artistique voit tous les documents.',
      },
      options: RECIPIENT_OPTIONS.map((o) => ({ label: o.label, value: o.value })),
    },
    {
      name: 'concert',
      type: 'relationship',
      relationTo: 'concerts',
      label: 'Concert',
      admin: {
        description: `Le document est classé sous ce concert et disparaît de l’espace membres ${DOCUMENT_GRACE_DAYS} jours après la dernière représentation.`,
      },
    },
    {
      name: 'visibleUntil',
      type: 'date',
      label: 'Visible jusqu’au',
      admin: {
        position: 'sidebar',
        date: { pickerAppearance: 'dayOnly', displayFormat: 'd MMMM yyyy' },
        description: `Laisser vide : ${DOCUMENT_GRACE_DAYS} jours après le concert, ou sans limite pour un document hors concert.`,
      },
    },
    {
      name: 'notes',
      type: 'textarea',
      label: 'Note aux membres',
      admin: { description: 'Facultatif : coups d’archet à reporter, édition utilisée, reprises…' },
    },
    // Renseignés par l'envoi du fichier (DocumentFileField).
    {
      name: 'fileKey',
      type: 'text',
      label: 'Fichier',
      admin: { hidden: true },
      validate: (value: unknown) => (value ? true : 'Ajoutez un fichier avant d’enregistrer.'),
    },
    { name: 'fileName', type: 'text', admin: { hidden: true } },
    { name: 'fileSize', type: 'number', admin: { hidden: true } },
    { name: 'fileType', type: 'text', admin: { hidden: true } },
  ],
};
