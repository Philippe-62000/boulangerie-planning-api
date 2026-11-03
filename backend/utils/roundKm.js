/** Arrondi km à 1 décimale (évite 225.50000000000003). */
function roundKm(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 10) / 10;
}

module.exports = { roundKm };
