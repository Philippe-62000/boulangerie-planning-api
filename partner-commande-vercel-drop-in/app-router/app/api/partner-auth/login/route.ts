/**
 * Remplace la route login Mongo locale sur Vercel.
 * Env Vercel : PARTNER_API_UPSTREAM = https://votre-service.onrender.com (sans slash final)
 */
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const base = process.env.PARTNER_API_UPSTREAM?.replace(/\/$/, '');
  if (!base) {
    return NextResponse.json(
      {
        success: false,
        error:
          'Configuration serveur : définir PARTNER_API_UPSTREAM (URL de base de l’API Render).'
      },
      { status: 500 }
    );
  }
  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  try {
    const r = await fetch(`${base}/api/partner-auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await r.json().catch(() => ({}));
    return NextResponse.json(data, { status: r.status });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ success: false, error: message }, { status: 502 });
  }
}
