/**
 * Helper centralisé pour le secret JWT.
 * Refuse de tourner sans `process.env.JWT_SECRET` en production : un fallback
 * hard-codé permettrait à un attaquant connaissant le code source de forger des tokens.
 *
 * En développement (NODE_ENV !== 'production'), un secret de repli aléatoire est généré
 * une seule fois au démarrage du process — les tokens deviennent invalides à chaque
 * redémarrage, ce qui est souhaitable pour un environnement local.
 */

let cachedDevSecret = null;

function buildDevSecret() {
  if (cachedDevSecret) return cachedDevSecret;
  const crypto = require('crypto');
  cachedDevSecret = crypto.randomBytes(48).toString('hex');
  console.warn('[jwtSecret] ⚠️ JWT_SECRET non défini : secret de DÉV éphémère généré.');
  return cachedDevSecret;
}

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (secret && secret.length >= 16) {
    return secret;
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'JWT_SECRET manquant ou trop court (>=16 caractères) en production. ' +
        'Définir la variable d\'environnement sur le service Render.'
    );
  }

  return buildDevSecret();
}

module.exports = { getJwtSecret };
