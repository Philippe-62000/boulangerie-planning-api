/**
 * Synchronise les fiches PartnerCompany vers le site de commande (ex. Vercel) si configuré.
 * Sans ces variables, la création existe uniquement sur MongoDB Render → connexion OK seulement
 * si la page de login utilise la même API / la même base (voir README équipe).
 *
 * Variables Render (optionnelles) :
 *   PARTNER_ORDER_APP_SYNC_URL   = URL complète POST (ex. https://xxx.vercel.app/api/internal-partner-sync)
 *   PARTNER_ORDER_APP_SYNC_SECRET = même secret que côté endpoint (header x-internal-secret)
 */
const axios = require('axios');

const url = process.env.PARTNER_ORDER_APP_SYNC_URL;
const secret =
  process.env.PARTNER_ORDER_APP_SYNC_SECRET || process.env.INTERNAL_API_SECRET || '';
const defaultAppBase =
  process.env.PARTNER_ORDER_APP_URL || 'https://commande-longuenesse.vercel.app';
const messageSyncUrl =
  process.env.PARTNER_ORDER_APP_MESSAGE_SYNC_URL ||
  `${String(defaultAppBase).replace(/\/+$/, '')}/api/internal-order-message`;

async function post(body) {
  if (!url || !secret) return;
  try {
    await axios.post(url, body, {
      headers: { 'Content-Type': 'application/json', 'x-internal-secret': secret },
      timeout: 12000
    });
  } catch (e) {
    console.error('⚠️ partnerOrderAppSync:', e.response?.status, e.response?.data || e.message);
  }
}

/** Création / mise à jour + mot de passe en clair (hash côté Render déjà fait ; le miroir peut refaire pareil). */
function syncUpsert({
  site,
  name,
  phone,
  email,
  active,
  plainPassword,
  contactName,
  mealTypesMode,
  offerBreakfast,
  offerLunch,
  offerDevis,
  offerCommande,
  isAnonymous,
  createdViaDashboardForm
}) {
  const body = {
    action: 'upsert',
    site,
    name,
    phone: phone || '',
    email: String(email).toLowerCase().trim(),
    active: active !== false,
    contactName: contactName != null ? String(contactName).trim() : '',
    mealTypesMode: mealTypesMode != null ? String(mealTypesMode) : 'both',
    offerBreakfast: offerBreakfast !== undefined ? !!offerBreakfast : undefined,
    offerLunch: offerLunch !== undefined ? !!offerLunch : undefined,
    offerDevis: offerDevis !== undefined ? !!offerDevis : undefined,
    offerCommande: offerCommande !== undefined ? !!offerCommande : undefined,
    isAnonymous: isAnonymous !== undefined ? !!isAnonymous : undefined,
    createdViaDashboardForm:
      createdViaDashboardForm !== undefined ? !!createdViaDashboardForm : undefined
  };
  Object.keys(body).forEach((k) => body[k] === undefined && delete body[k]);
  if (plainPassword) body.password = plainPassword;
  return post(body);
}

/** Compte désactivé sans changer le hash (login bloqué). */
function syncDeactivate({ site, email }) {
  return post({
    action: 'deactivate',
    site,
    email: String(email).toLowerCase().trim(),
    active: false
  });
}

/** Suppression définitive du miroir (même e-mail recréé ailleurs). */
function syncDelete({ email }) {
  return post({
    action: 'delete',
    email: String(email).toLowerCase().trim()
  });
}

/** Suppression d'une commande miroir sur Vercel (si endpoint internal-partner-sync gère action deleteOrder). */
function syncOrderDelete({ orderId, site }) {
  return post({
    action: 'deleteOrder',
    orderId: String(orderId),
    site: site || 'longuenesse'
  });
}

/**
 * Message boulangerie/client → Mongo du site Vercel (obligatoire si base distincte de Render).
 * Utilise INTERNAL_API_SECRET ou PARTNER_ORDER_APP_SYNC_SECRET (même valeur que sur Vercel).
 */
async function syncOrderMessage({
  site,
  orderId,
  renderOrderId,
  vercelOrderId,
  companyEmail,
  datetime,
  from,
  text
}) {
  if (!secret) {
    console.warn('⚠️ syncOrderMessage: secret manquant (INTERNAL_API_SECRET)');
    return { ok: false };
  }
  try {
    const r = await axios.post(
      messageSyncUrl,
      {
        site: site || 'longuenesse',
        orderId: String(orderId || vercelOrderId || renderOrderId || ''),
        renderOrderId: renderOrderId ? String(renderOrderId) : undefined,
        vercelOrderId: vercelOrderId ? String(vercelOrderId) : undefined,
        companyEmail: companyEmail ? String(companyEmail).toLowerCase().trim() : undefined,
        datetime: datetime ? new Date(datetime).toISOString() : undefined,
        from: from === 'client' ? 'client' : 'bakery',
        text: String(text || '').trim()
      },
      {
        headers: { 'Content-Type': 'application/json', 'x-internal-secret': secret },
        timeout: 12000
      }
    );
    return { ok: true, status: r.status };
  } catch (e) {
    console.error('⚠️ partnerOrderAppSync message:', e.response?.status, e.response?.data || e.message);
    return { ok: false, error: e.message };
  }
}

module.exports = {
  syncUpsert,
  syncDeactivate,
  syncDelete,
  syncOrderDelete,
  syncOrderMessage
};
