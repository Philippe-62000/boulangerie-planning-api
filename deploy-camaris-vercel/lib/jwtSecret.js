function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (secret && secret.length >= 16) return secret;
  throw new Error('JWT_SECRET manquant ou trop court (>=16 car.) sur Vercel — même valeur que Render api-3.');
}

module.exports = { getJwtSecret };
