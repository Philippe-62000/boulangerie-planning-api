/** URL de base Render (sans /api final). Ex. https://boulangerie-planning-api-3.onrender.com */
export function getPartnerApiUpstream(): string | null {
  const base = process.env.PARTNER_API_UPSTREAM?.replace(/\/$/, '');
  return base || null;
}
