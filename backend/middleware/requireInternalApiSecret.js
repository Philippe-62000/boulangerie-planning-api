/** Routes appelées par le site Vercel (header x-internal-secret = INTERNAL_API_SECRET). */
module.exports = function requireInternalApiSecret(req, res, next) {
  const expected = process.env.INTERNAL_API_SECRET;
  if (!expected) {
    return res.status(500).json({ success: false, error: 'INTERNAL_API_SECRET manquant sur le serveur' });
  }
  const got = req.headers['x-internal-secret'];
  if (!got || got !== expected) {
    return res.status(401).json({ success: false, error: 'Secret interne invalide' });
  }
  next();
};
