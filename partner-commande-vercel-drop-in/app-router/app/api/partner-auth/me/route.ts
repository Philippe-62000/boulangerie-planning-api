import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
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
  const auth = req.headers.get('authorization');
  try {
    const r = await fetch(`${base}/api/partner-auth/me`, {
      headers: auth ? { Authorization: auth } : {}
    });
    const data = await r.json().catch(() => ({}));
    return NextResponse.json(data, { status: r.status });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ success: false, error: message }, { status: 502 });
  }
}
