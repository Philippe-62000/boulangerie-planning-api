/** Carton + unité (stocks TGT / Mill'Ange et commande fournisseur). */

function numOrNull(v) {
  if (v === '' || v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? Math.max(0, n) : null;
}

/** Ancien champ unique `stockQty` → carton si carton/unité absents. */
function normalizeStockFields(raw) {
  const line = raw && typeof raw === 'object' ? raw : {};
  const legacy = numOrNull(line.stockQty);
  let cartonQty = numOrNull(line.cartonQty);
  let unitQty = numOrNull(line.unitQty);
  if (cartonQty == null && unitQty == null && legacy != null) {
    cartonQty = legacy;
  }
  return { cartonQty, unitQty, legacyStockQty: legacy };
}

/** Total stock pour conso = carton + unité (si au moins une valeur saisie). */
function effectiveStockTotal(raw) {
  const { cartonQty, unitQty } = normalizeStockFields(raw);
  if (cartonQty == null && unitQty == null) return null;
  return (cartonQty ?? 0) + (unitQty ?? 0);
}

function hasAnyStockValue(raw) {
  const { cartonQty, unitQty } = normalizeStockFields(raw);
  return cartonQty != null || unitQty != null;
}

function sanitizeStockPayload(raw) {
  const { cartonQty, unitQty } = normalizeStockFields(raw);
  return {
    cartonQty,
    unitQty,
    stockQty: null
  };
}

module.exports = {
  numOrNull,
  normalizeStockFields,
  effectiveStockTotal,
  hasAnyStockValue,
  sanitizeStockPayload
};
