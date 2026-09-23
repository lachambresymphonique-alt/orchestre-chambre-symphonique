import { createHash } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import type { CollectionSlug } from 'payload';
import { getPayloadClient } from '@/lib/payload';
import { todayKey } from '@/lib/concerts';

/**
 * Compteur de visites du site public (émetteur : `src/components/PageViewTracker.tsx`).
 *
 * Reçoit un signal par page vue et l'enregistre dans la collection `page-views`.
 * Respectueux des visiteurs : pas de cookie, pas d'adresse IP stockée. Une
 * empreinte anonyme (hachage salé de l'IP + navigateur, renouvelée chaque jour)
 * permet seulement de compter chaque visiteur une fois par jour.
 *
 * Ne sont pas comptés : les robots et navigateurs automatisés, les
 * administrateurs connectés (cookie de session Payload présent) et l'aperçu en
 * direct de l'admin (le script ne s'exécute pas dans une iframe).
 *
 * La réponse est toujours 204, même en cas de rejet : le navigateur n'attend
 * rien et il n'y a rien à révéler.
 */

const BOT_RE =
  /bot|crawl|spider|slurp|headless|lighthouse|pagespeed|prerender|phantom|selenium|puppeteer|playwright|facebookexternalhit|whatsapp|telegram|discord|skype|curl\/|wget\/|python|java\/|okhttp|httpclient|monitor|pingdom|uptime/i;

const MAX_PATH_LENGTH = 200;
const MAX_HOST_LENGTH = 100;

const ok = () => new NextResponse(null, { status: 204 });

function cleanPath(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  let path = raw.trim().split(/[?#]/)[0];
  if (!path.startsWith('/') || path.length > MAX_PATH_LENGTH) return null;
  if (/[\s\u0000-\u001f]/.test(path)) return null;
  if (path.length > 1 && path.endsWith('/')) path = path.slice(0, -1);
  if (/^\/(admin|api|_next)(\/|$)/.test(path)) return null;
  return path;
}

function hostOf(value: string | null | undefined): string {
  if (!value) return '';
  try {
    const url = new URL(value.includes('://') ? value : `https://${value}`);
    return url.hostname.toLowerCase().replace(/^www\./, '');
  } catch {
    return '';
  }
}

function referrerHost(raw: unknown, ownHosts: string[]): string {
  if (typeof raw !== 'string' || !/^https?:\/\//i.test(raw)) return '';
  const host = hostOf(raw);
  if (!host || ownHosts.includes(host)) return '';
  return host.slice(0, MAX_HOST_LENGTH);
}

function deviceOf(ua: string, width: number | null): 'mobile' | 'tablet' | 'desktop' {
  if (/ipad|tablet|silk|kindle|playbook|android(?!.*mobile)/i.test(ua)) return 'tablet';
  if (/mobi|iphone|ipod|android|blackberry|opera mini|iemobile|windows phone/i.test(ua)) return 'mobile';
  if (width !== null && width > 0 && width < 768) return 'mobile';
  return 'desktop';
}

function clientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return req.headers.get('x-real-ip') || 'unknown';
}

export async function POST(req: NextRequest) {
  try {
    const ua = req.headers.get('user-agent') || '';
    if (!ua || BOT_RE.test(ua)) return ok();
    // Administrateur connecté : ses propres visites ne comptent pas.
    if (req.cookies.get('payload-token')) return ok();

    let body: Record<string, unknown>;
    try {
      body = JSON.parse(await req.text());
    } catch {
      return ok();
    }
    if (!body || typeof body !== 'object') return ok();

    const path = cleanPath(body.path);
    if (!path) return ok();

    const ownHosts = [
      hostOf(req.headers.get('host')),
      hostOf(req.headers.get('origin')),
      hostOf(process.env.NEXT_PUBLIC_SITE_URL),
    ].filter(Boolean);

    const entry = body.entry === true;
    const referrer = entry ? referrerHost(body.referrer, ownHosts) : '';
    const width = typeof body.width === 'number' && Number.isFinite(body.width) ? body.width : null;
    const device = deviceOf(ua, width);

    const secret = process.env.PAYLOAD_SECRET || 'dev-secret-change-in-production';
    const visitor = createHash('sha256')
      .update(`${secret}|${todayKey()}|${clientIp(req)}|${ua}`)
      .digest('hex')
      .slice(0, 32);

    const payload = await getPayloadClient();
    await payload.create({
      collection: 'page-views' as CollectionSlug,
      data: { path, referrer, device, visitor, entry },
      depth: 0,
    });
  } catch (error) {
    console.error('Page view error:', error);
  }
  return ok();
}
