/**
 * Proxy POST réponse client → API Render.
 * Copier vers : app/api/partner-orders/my/[id]/reply/route.ts
 */
import { NextRequest, NextResponse } from 'next/server';
import { getPartnerApiUpstream } from '../../../../../lib/partnerApiUpstream';

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, context: RouteContext) {
  const base = getPartnerApiUpstream();
  if (!base) {
    return NextResponse.json(
      { success: false, error: 'PARTNER_API_UPSTREAM non configuré sur Vercel.' },
      { status: 500 }
    );
  }

  const { id } = await context.params;
  const auth = req.headers.get('authorization') || '';
  const site = req.nextUrl.searchParams.get('site') || 'longuenesse';

  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  try {
    const r = await fetch(`${base}/api/partner-orders/my/${id}/reply?site=${encodeURIComponent(site)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: auth
      },
      body: JSON.stringify({ ...body, site })
    });
    const data = await r.json().catch(() => ({}));
    return NextResponse.json(data, { status: r.status });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ success: false, error: message }, { status: 502 });
  }
}
