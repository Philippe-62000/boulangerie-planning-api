const siteMap = { lon: 'longuenesse', plan: 'arras' };

function normalizePartnerSite(raw) {
  const v = String(raw || 'longuenesse').toLowerCase();
  return siteMap[v] || (v === 'arras' ? 'arras' : 'longuenesse');
}

/** URL du site de commande entreprises (Vercel) selon le site Filmara. */
function getPartnerOrderAppUrl(site) {
  const fromEnv = String(process.env.PARTNER_ORDER_APP_URL || '').trim();
  if (fromEnv) return fromEnv.replace(/\/+$/, '');
  return normalizePartnerSite(site) === 'arras'
    ? 'https://commande-arras.vercel.app'
    : 'https://commande-longuenesse.vercel.app';
}

/** Libellé affiché dans les e-mails (signature). */
function getPartnerSiteDisplayLabel(site) {
  const fromEnv = String(process.env.PARTNER_SITE_LABEL || '').trim();
  if (fromEnv) return fromEnv;
  return normalizePartnerSite(site) === 'arras' ? 'Arras' : 'Longuenesse';
}

module.exports = {
  normalizePartnerSite,
  getPartnerOrderAppUrl,
  getPartnerSiteDisplayLabel
};
