import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).end();
  }
  const base = process.env.PARTNER_API_UPSTREAM?.replace(/\/$/, '');
  if (!base) {
    return res.status(500).json({
      success: false,
      error:
        'Configuration serveur : définir PARTNER_API_UPSTREAM (URL de base de l’API Render).'
    });
  }
  const auth = req.headers.authorization;
  try {
    const r = await fetch(`${base}/api/partner-auth/me`, {
      headers: auth ? { Authorization: auth } : {}
    });
    const data = await r.json().catch(() => ({}));
    return res.status(r.status).json(data);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return res.status(502).json({ success: false, error: message });
  }
}
