/**
 * Proxy POST réponse client → API Render (Pages Router).
 * Copier vers : pages/api/partner-orders/my/[id]/reply.ts
 */
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const base = process.env.PARTNER_API_UPSTREAM?.replace(/\/$/, '');
  if (!base) {
    return res.status(500).json({ success: false, error: 'PARTNER_API_UPSTREAM non configuré.' });
  }

  const id = String(req.query.id || '');
  const site = String(req.query.site || req.body?.site || 'longuenesse');
  const auth = req.headers.authorization || '';

  try {
    const r = await fetch(`${base}/api/partner-orders/my/${id}/reply?site=${encodeURIComponent(site)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: auth
      },
      body: JSON.stringify({ ...(typeof req.body === 'object' ? req.body : {}), site })
    });
    const data = await r.json().catch(() => ({}));
    return res.status(r.status).json(data);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return res.status(502).json({ success: false, error: message });
  }
}
