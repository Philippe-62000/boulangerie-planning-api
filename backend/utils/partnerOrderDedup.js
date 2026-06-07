/**
 * Quand Vercel et Filmara partagent la même base MongoDB, internal-from-vercel
 * créait une 2e fiche (vercelOrderId → id Vercel) en plus de la fiche client.
 * On masque la copie miroir si la commande d’origine est dans le même jeu de résultats.
 */
function filterDuplicateVercelMirrorOrders(orders) {
  const list = Array.isArray(orders) ? orders : [];
  if (list.length <= 1) return list;
  const byId = new Map(list.map((o) => [String(o._id || o.id), o]));
  return list.filter((o) => {
    const vid = o?.vercelOrderId != null ? String(o.vercelOrderId).trim() : '';
    if (!vid) return true;
    return !byId.has(vid);
  });
}

module.exports = { filterDuplicateVercelMirrorOrders };
