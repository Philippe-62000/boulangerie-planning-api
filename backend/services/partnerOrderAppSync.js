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
const { getPartnerOrderAppUrl } = require('../utils/partnerSiteConfig');

const url = process.env.PARTNER_ORDER_APP_SYNC_URL;
function getSyncSecret() {
  return String(
    process.env.PARTNER_ORDER_APP_SYNC_SECRET || process.env.INTERNAL_API_SECRET || ''
  ).trim();
}

const secret = getSyncSecret();

/**
 * Copie le message vers la base lue par le site Vercel (souvent même cluster, autre MONGODB_DB).
 * Désactiver : PARTNER_ORDER_SKIP_VERCEL_MESSAGE_SYNC=true
 * Ne pas copier (Mongo strictement identique partout) : PARTNER_ORDER_SHARED_MONGO=true
 */
function shouldSyncMessageToVercel() {
  if (process.env.PARTNER_ORDER_SKIP_VERCEL_MESSAGE_SYNC === 'true') return false;
  if (process.env.PARTNER_ORDER_SHARED_MONGO === 'true') return false;
  return true;
}
const defaultAppBase = getPartnerOrderAppUrl(process.env.PARTNER_SITE || process.env.DEFAULT_SITE);
const messageSyncUrl =
  process.env.PARTNER_ORDER_APP_MESSAGE_SYNC_URL ||
  `${String(defaultAppBase).replace(/\/+$/, '')}/api/internal-order-message`;
const clientRequestSyncUrl =
  process.env.PARTNER_ORDER_APP_CLIENT_REQUEST_SYNC_URL ||
  `${String(defaultAppBase).replace(/\/+$/, '')}/api/internal-order-client-request`;

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
  offerListe,
  enabledProductListKeys,
  fulfillmentMode,
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
    offerListe: offerListe !== undefined ? !!offerListe : undefined,
    enabledProductListKeys:
      enabledProductListKeys !== undefined
        ? (Array.isArray(enabledProductListKeys) ? enabledProductListKeys : [])
        : undefined,
    fulfillmentMode: fulfillmentMode !== undefined ? String(fulfillmentMode) : undefined,
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
  if (!shouldSyncMessageToVercel()) {
    return { ok: true, skipped: 'shared_mongo' };
  }
  const syncSecret = getSyncSecret();
  if (!syncSecret) {
    console.warn('⚠️ syncOrderMessage: secret manquant (INTERNAL_API_SECRET sur Render)');
    return { ok: false, reason: 'no_secret' };
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
        headers: { 'Content-Type': 'application/json', 'x-internal-secret': syncSecret },
        timeout: 12000
      }
    );
    return { ok: true, status: r.status };
  } catch (e) {
    const status = e.response?.status;
    const apiError =
      (e.response?.data && (e.response.data.error || e.response.data.message)) || null;
    console.error('⚠️ partnerOrderAppSync message:', status, e.response?.data || e.message);
    return { ok: false, reason: 'http_error', status, apiError, error: e.message };
  }
}

/** Demande client ou prise en compte admin → Mongo Vercel. */
async function syncOrderClientRequest({
  site,
  orderId,
  vercelOrderId,
  clientRequest,
  status
}) {
  if (!shouldSyncMessageToVercel()) {
    return { ok: true, skipped: 'shared_mongo' };
  }
  const syncSecret = getSyncSecret();
  if (!syncSecret) {
    console.warn('⚠️ syncOrderClientRequest: secret manquant (INTERNAL_API_SECRET sur Render)');
    return { ok: false, reason: 'no_secret' };
  }
  try {
    const r = await axios.post(
      clientRequestSyncUrl,
      {
        site: site || 'longuenesse',
        orderId: String(vercelOrderId || orderId || ''),
        renderOrderId: orderId ? String(orderId) : undefined,
        vercelOrderId: vercelOrderId ? String(vercelOrderId) : undefined,
        clientRequest,
        status
      },
      {
        headers: { 'Content-Type': 'application/json', 'x-internal-secret': syncSecret },
        timeout: 12000
      }
    );
    return { ok: true, status: r.status };
  } catch (e) {
    const statusCode = e.response?.status;
    console.error('⚠️ partnerOrderAppSync clientRequest:', statusCode, e.response?.data || e.message);
    return { ok: false, reason: 'http_error', status: statusCode, error: e.message };
  }
}

/** Vérifie que Render peut joindre Vercel avec le secret configuré. */
async function pingVercelSync() {
  const syncSecret = getSyncSecret();
  if (!syncSecret) return { ok: false, reason: 'no_secret' };
  const pingUrl = `${String(defaultAppBase).replace(/\/+$/, '')}/api/internal-sync-ping`;
  try {
    const r = await axios.post(
      pingUrl,
      {},
      {
        headers: { 'Content-Type': 'application/json', 'x-internal-secret': syncSecret },
        timeout: 10000
      }
    );
    return { ok: true, status: r.status, data: r.data };
  } catch (e) {
    return {
      ok: false,
      status: e.response?.status,
      apiError: e.response?.data?.error,
      error: e.message
    };
  }
}

module.exports = {
  syncUpsert,
  syncDeactivate,
  syncDelete,
  syncOrderDelete,
  syncOrderMessage,
  syncOrderClientRequest,
  pingVercelSync
};
