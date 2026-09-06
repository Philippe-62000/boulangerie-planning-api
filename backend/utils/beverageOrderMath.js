/**
 * Calculs commande boissons / emballages (unités + colis).
 */

const { isIgnoredBeverageName } = require('./parseCrisalidInvendusPdf');

function computeUnitsNeeded(consumedQty, stockQty, marginPercent) {
  const consumed = Math.max(0, Number(consumedQty) || 0);
  const stock = Math.max(0, Number(stockQty) || 0);
  const margin = Math.max(0, Number(marginPercent) || 0);
  const need = Math.ceil(consumed * (1 + margin / 100));
  return Math.max(0, need - stock);
}

function normalizePackSize(raw, fallback = 12) {
  const n = Number(raw);
  if (n === 24) return 24;
  if (n === 12) return 12;
  return fallback === 24 ? 24 : 12;
}

/** Unités manquantes → nombre de colis arrondi au-dessus. */
function computePacksToOrder(unitsNeeded, packSize) {
  const units = Math.max(0, Number(unitsNeeded) || 0);
  const size = normalizePackSize(packSize);
  if (units <= 0) return 0;
  return Math.ceil(units / size);
}

function enrichOrderFields(product, marginPercent = 10, defaultPackSize = 12) {
  const consumedQty = Math.max(
    0,
    Number(
      product.consumedQty != null
        ? product.consumedQty
        : (Number(product.ventesQty) || 0) + (Number(product.offertsQty) || 0)
    )
  );
  const stockQty = Math.max(0, Number(product.stockQty) || 0);
  const lineMargin =
    product.marginPercent != null && product.marginPercent !== ''
      ? Math.max(0, Number(product.marginPercent))
      : Math.max(0, Number(marginPercent) || 0);
  const packSize = normalizePackSize(product.packSize, defaultPackSize);
  const toOrderQty = computeUnitsNeeded(consumedQty, stockQty, lineMargin);
  const packsToOrder = computePacksToOrder(toOrderQty, packSize);
  return {
    ...product,
    consumedQty,
    stockQty,
    marginPercent: lineMargin,
    packSize,
    toOrderQty,
    packsToOrder,
    orderUnits: packsToOrder * packSize
  };
}

/**
 * Écarts entre deux listes de produits (par nom normalisé).
 * Alerte si chute forte, disparition, ou apparition.
 */
function compareSalesPeriods(previousProducts, currentProducts, options = {}) {
  const absThreshold = Math.max(1, Number(options.absThreshold) || 10);
  const relThreshold = Math.max(0.1, Number(options.relThreshold) || 0.4);

  const keyOf = (p) => String(p.name || '').trim().toUpperCase();
  const prevMap = new Map();
  for (const p of previousProducts || []) {
    if (!p?.name || isIgnoredBeverageName(p.name)) continue;
    prevMap.set(keyOf(p), p);
  }
  const currMap = new Map();
  for (const p of currentProducts || []) {
    if (!p?.name || isIgnoredBeverageName(p.name)) continue;
    currMap.set(keyOf(p), p);
  }

  const alerts = [];
  const allKeys = new Set([...prevMap.keys(), ...currMap.keys()]);

  for (const key of allKeys) {
    const prev = prevMap.get(key);
    const curr = currMap.get(key);
    const prevQty = prev ? Number(prev.consumedQty) || 0 : 0;
    const currQty = curr ? Number(curr.consumedQty) || 0 : 0;
    const delta = currQty - prevQty;
    const name = (curr || prev).name;
    const category = (curr || prev).category || '';

    if (!prev && curr) {
      alerts.push({
        type: 'new',
        severity: 'info',
        name,
        category,
        previousQty: 0,
        currentQty: currQty,
        delta,
        message: 'Nouvelle référence (absente du fichier précédent)'
      });
      continue;
    }
    if (prev && !curr) {
      alerts.push({
        type: 'missing',
        severity: 'warn',
        name,
        category,
        previousQty: prevQty,
        currentQty: 0,
        delta: -prevQty,
        message: 'Absente du nouveau fichier (rupture possible ou délistée)'
      });
      continue;
    }

    if (prevQty <= 0 && currQty <= 0) continue;

    const drop = prevQty - currQty;
    const relDrop = prevQty > 0 ? drop / prevQty : 0;
    if (drop >= absThreshold && relDrop >= relThreshold) {
      alerts.push({
        type: 'drop',
        severity: 'alert',
        name,
        category,
        previousQty: prevQty,
        currentQty: currQty,
        delta,
        relDrop,
        message: `Forte baisse (−${drop}, ${Math.round(relDrop * 100)} %) — possible rupture de stock`
      });
    } else if (currQty - prevQty >= absThreshold && prevQty > 0 && (currQty - prevQty) / prevQty >= relThreshold) {
      alerts.push({
        type: 'rise',
        severity: 'info',
        name,
        category,
        previousQty: prevQty,
        currentQty: currQty,
        delta,
        message: `Forte hausse (+${currQty - prevQty})`
      });
    } else if (prevQty >= absThreshold && currQty === 0) {
      alerts.push({
        type: 'zero',
        severity: 'alert',
        name,
        category,
        previousQty: prevQty,
        currentQty: 0,
        delta: -prevQty,
        message: 'Plus aucune vente cette période — rupture probable'
      });
    }
  }

  const severityRank = { alert: 0, warn: 1, info: 2 };
  alerts.sort((a, b) => (severityRank[a.severity] ?? 9) - (severityRank[b.severity] ?? 9) || a.name.localeCompare(b.name));
  return alerts;
}

function isEmballageCategory(category) {
  return /emballage/i.test(String(category || ''));
}

module.exports = {
  computeUnitsNeeded,
  computePacksToOrder,
  normalizePackSize,
  enrichOrderFields,
  compareSalesPeriods,
  isEmballageCategory
};
