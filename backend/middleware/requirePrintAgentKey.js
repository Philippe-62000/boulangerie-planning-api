/**
 * Routes appelées par l'agent d'impression des caisses (header x-print-key).
 * Clé dédiée PRINT_AGENT_KEY, avec repli sur INTERNAL_API_SECRET si absente.
 */
module.exports = function requirePrintAgentKey(req, res, next) {
  const expected = String(
    process.env.PRINT_AGENT_KEY ||
      process.env.INTERNAL_API_SECRET ||
      process.env.PARTNER_ORDER_APP_SYNC_SECRET ||
      ''
  ).trim();
  if (!expected) {
    return res
      .status(500)
      .json({ success: false, error: 'PRINT_AGENT_KEY manquant sur le serveur' });
  }
  const got = String(req.headers['x-print-key'] || '').trim();
  if (!got || got !== expected) {
    return res.status(401).json({ success: false, error: 'Clé agent impression invalide' });
  }
  next();
};
