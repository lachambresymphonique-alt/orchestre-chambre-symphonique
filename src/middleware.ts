import { NextResponse, type NextRequest } from 'next/server';
import { concertsUpcomingListUrl } from '@/lib/concerts';

/**
 * Vue de départ de la liste des concerts dans l'admin : « À venir ».
 *
 * Ouvrir la liste sans filtre montrait toute la programmation, archives
 * comprises, alors que le travail courant porte sur les dates à venir. On
 * redirige donc l'adresse nue vers le filtre de l'onglet « À venir ».
 * Les onglets « Passés » et « Tous » portent des paramètres : ils ne sont
 * jamais redirigés, et aucune boucle n'est possible.
 */
export function middleware(request: NextRequest) {
  if (request.nextUrl.search) return NextResponse.next();
  return NextResponse.redirect(new URL(concertsUpcomingListUrl(), request.nextUrl));
}

export const config = {
  // Adresses littérales : Next analyse ce filtre à la compilation.
  matcher: ['/admin/collections/concerts', '/admin/collections/concerts/'],
};
