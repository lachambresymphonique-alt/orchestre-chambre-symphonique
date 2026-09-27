import { NextRequest, NextResponse } from 'next/server';
import { MEMBER_COOKIE } from '@/lib/memberSession';

/** Fermeture de la session de l'espace membres (formulaire « Se déconnecter »). */
export async function POST(req: NextRequest) {
  const res = NextResponse.redirect(new URL('/espace-membres?deconnecte=1', req.nextUrl.origin), 303);
  res.cookies.delete(MEMBER_COOKIE);
  return res;
}
