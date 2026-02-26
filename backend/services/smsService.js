/**
 * Service d'envoi de SMS via l'API OVHcloud
 * Nécessite les variables d'environnement : OVH_APP_KEY, OVH_APP_SECRET, OVH_CONSUMER_KEY
 */

const ovh = require('ovh');

// Max 149 caractères pour le 1er SMS commercial (7bits) - la mention STOP (11 chars) est déduite
const MAX_SMS_LENGTH = 149;

/**
 * Normalise un numéro de téléphone français au format OVH (0033XXXXXXXXX)
 * @param {string} phone - Numéro au format 06..., +33..., 336..., etc.
 * @returns {string|null} - Format 0033XXXXXXXXX ou null si invalide
 */
function normalizePhone(phone) {
  if (!phone || typeof phone !== 'string') return null;
  const cleaned = phone.replace(/\s/g, '').replace(/\./g, '');
  let digits = cleaned.replace(/\D/g, '');
  if (digits.startsWith('33') && digits.length === 11) {
    return '00' + digits;
  }
  if (digits.startsWith('0') && digits.length === 10) {
    return '0033' + digits.slice(1);
  }
  if (digits.length === 9 && digits.startsWith('6') || digits.startsWith('7')) {
    return '0033' + digits;
  }
  if (digits.startsWith('33') && digits.length >= 11) {
    return '00' + digits.slice(0, 11);
  }
  return null;
}

/**
 * Vérifie si le service SMS OVH est configuré
 */
function isConfigured() {
  return !!(
    process.env.OVH_APP_KEY &&
    process.env.OVH_APP_SECRET &&
    process.env.OVH_CONSUMER_KEY
  );
}

/**
 * Envoie un SMS via l'API OVH
 * @param {string} message - Message (max 149 chars pour SMS commercial, mention STOP ajoutée si absente)
 * @param {string[]} receivers - Liste de numéros au format 0033XXXXXXXXX
 * @returns {Promise<{success: boolean, result?: object, invalidReceivers?: string[], error?: string}>}
 */
function sendSms(message, receivers) {
  return new Promise((resolve, reject) => {
    if (!isConfigured()) {
      return resolve({
        success: false,
        error: 'Service SMS non configuré (OVH_APP_KEY, OVH_APP_SECRET, OVH_CONSUMER_KEY manquants)'
      });
    }

    const normalizedReceivers = receivers
      .map(r => normalizePhone(r))
      .filter(Boolean);

    if (normalizedReceivers.length === 0) {
      return resolve({
        success: false,
        error: 'Aucun numéro de téléphone valide',
        invalidReceivers: receivers
      });
    }

    // SMS commercial : ajouter STOP si absent (obligatoire)
    let finalMessage = message.trim();
    if (!finalMessage.toUpperCase().includes('STOP')) {
      finalMessage = finalMessage + ' STOP';
    }
    // OVH découpe automatiquement les messages longs en plusieurs SMS

    const ovhClient = ovh({
      appKey: process.env.OVH_APP_KEY,
      appSecret: process.env.OVH_APP_SECRET,
      consumerKey: process.env.OVH_CONSUMER_KEY
    });

    ovhClient.request('GET', '/sms', (err, serviceName) => {
      if (err) {
        console.error('Erreur OVH GET /sms:', err);
        return resolve({
          success: false,
          error: err.message || 'Erreur API OVH (récupération compte SMS)'
        });
      }

      const smsAccount = Array.isArray(serviceName) ? serviceName[0] : serviceName;

      ovhClient.request('POST', `/sms/${smsAccount}/jobs`, {
        message: finalMessage,
        senderForResponse: true,
        receivers: normalizedReceivers
      }, (errSend, result) => {
        if (errSend) {
          console.error('Erreur OVH POST jobs:', errSend);
          return resolve({
            success: false,
            error: errSend.message || 'Erreur envoi SMS'
          });
        }
        resolve({
          success: true,
          result: {
            totalCreditsRemoved: result?.totalCreditsRemoved,
            validReceivers: result?.validReceivers || [],
            invalidReceivers: result?.invalidReceivers || [],
            ids: result?.ids || []
          }
        });
      });
    });
  });
}

/**
 * Envoie des SMS personnalisés à plusieurs destinataires (un SMS par destinataire)
 * @param {Array<{phone: string, message: string}>} items - Liste {phone, message}
 * @returns {Promise<{sent: number, failed: number, details: Array}>}
 */
async function sendBulkSms(items) {
  const details = [];
  let sent = 0;
  let failed = 0;

  for (const item of items) {
    const res = await sendSms(item.message, [item.phone]);
    if (res.success && res.result?.validReceivers?.length > 0) {
      sent++;
      details.push({ phone: item.phone, status: 'ok' });
    } else {
      failed++;
      details.push({
        phone: item.phone,
        status: 'error',
        error: res.error || 'Envoi échoué'
      });
    }
  }

  return { sent, failed, details };
}

/**
 * Récupère la blacklist OVH (numéros ayant répondu STOP)
 * @returns {Promise<string[]>} Liste des numéros blacklistés (format OVH 0033...)
 */
function getBlacklist() {
  return new Promise((resolve) => {
    if (!isConfigured()) {
      return resolve([]);
    }
    const ovhClient = ovh({
      appKey: process.env.OVH_APP_KEY,
      appSecret: process.env.OVH_APP_SECRET,
      consumerKey: process.env.OVH_CONSUMER_KEY
    });
    ovhClient.request('GET', '/sms', (err, serviceName) => {
      if (err) {
        console.warn('Erreur OVH GET /sms (blacklist):', err.message);
        return resolve([]);
      }
      const smsAccount = Array.isArray(serviceName) ? serviceName[0] : serviceName;
      ovhClient.request('GET', `/sms/${smsAccount}/blacklist`, (errBlacklist, numbers) => {
        if (errBlacklist) {
          console.warn('OVH blacklist non disponible:', errBlacklist.message);
          return resolve([]);
        }
        resolve(Array.isArray(numbers) ? numbers : []);
      });
    });
  });
}

module.exports = {
  sendSms,
  sendBulkSms,
  normalizePhone,
  isConfigured,
  getBlacklist,
  MAX_SMS_LENGTH
};
