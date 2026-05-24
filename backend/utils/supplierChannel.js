const SUPPLIER_TGT = 'TGT';
const SUPPLIER_MILLANGE = 'MILLANGE';

const parseSupplier = (raw) => {
  const s = String(raw || SUPPLIER_TGT)
    .trim()
    .toUpperCase()
    .replace(/['\s_-]/g, '');
  if (s === 'MILLANGE') return SUPPLIER_MILLANGE;
  return SUPPLIER_TGT;
};

/** Filtre catalogue : compat produits TGT sans champ supplier. */
const catalogQuery = (siteKey, supplier) => {
  if (parseSupplier(supplier) === SUPPLIER_MILLANGE) {
    return { siteKey, supplier: SUPPLIER_MILLANGE };
  }
  return {
    siteKey,
    $or: [{ supplier: SUPPLIER_TGT }, { supplier: { $exists: false } }, { supplier: null }, { supplier: '' }]
  };
};

const orderQuery = (siteKey, weekKey, supplier) => ({
  siteKey,
  deliveryWeekKey: weekKey,
  supplier: parseSupplier(supplier)
});

module.exports = {
  SUPPLIER_TGT,
  SUPPLIER_MILLANGE,
  parseSupplier,
  catalogQuery,
  orderQuery
};
