const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const SupplierOrderLocation = require('../models/SupplierOrderLocation');
const SupplierOrderProduct = require('../models/SupplierOrderProduct');
const SupplierOrder = require('../models/SupplierOrder');
const SupplierOrderDelivery = require('../models/SupplierOrderDelivery');
const PositiveScan = require('../models/PositiveScan');
const PositiveCatalog = require('../models/PositiveCatalog');
const TgtStockEntry = require('../models/TgtStockEntry');
const tgtPdfParser = require('../services/tgtPdfParser');
const {
  effectiveStockTotal,
  hasAnyStockValue,
  normalizeStockFields,
  sanitizeStockPayload
} = require('../utils/stockQtyFields');
const {
  parseSupplier,
  catalogQuery,
  orderQuery,
  SUPPLIER_TGT,
  SUPPLIER_MILLANGE
} = require('../utils/supplierChannel');

const getSupplierFromReq = (req) => parseSupplier(req.query?.supplier || req.body?.supplier);

const deliveryQuery = (siteKey, supplier) => {
  const s = parseSupplier(supplier);
  if (s === SUPPLIER_MILLANGE) return { siteKey, supplier: SUPPLIER_MILLANGE };
  return {
    siteKey,
    $or: [{ supplier: SUPPLIER_TGT }, { supplier: { $exists: false } }, { supplier: null }, { supplier: '' }]
  };
};

/** Nombre de BL conservés en historique (cmd -1 = plus récent, cmd -6 = le plus ancien). */
const CMD_HISTORY_DEPTH = 6;
const CMD_QTY_FIELDS = [
  'lastOrderQty',
  'prevOrderQty',
  'cmdQty3',
  'cmdQty4',
  'cmdQty5',
  'cmdQty6'
];

const DEFAULT_LOCATIONS = [
  'Positive',
  'Négative',
  'Étagère prépa',
  'Étagère boulanger',
  'Étagère réserve',
  'Vente'
];

const parseSiteKey = (v) => (v === 'lon' || v === 'plan' ? v : null);

function normalizeName(s) {
  return String(s || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/** ObjectId emplacement (chaîne, ObjectId ou champ populate `{ _id, name }`). */
function normalizeLocationId(raw) {
  if (raw == null || raw === '') return null;
  if (typeof raw === 'object') {
    const id = raw._id ?? raw.id;
    if (id == null || id === '') return null;
    raw = id;
  }
  const s = String(raw).trim();
  if (!s || !mongoose.Types.ObjectId.isValid(s)) return null;
  return new mongoose.Types.ObjectId(s);
}

function productLocationId(product) {
  if (!product?.locationId) return null;
  const loc = product.locationId;
  if (loc && typeof loc === 'object' && loc._id) return loc._id;
  return loc;
}

function buildLocationMaps(locations) {
  const locById = new Map((locations || []).map((l) => [String(l._id), l]));
  const locByName = new Map((locations || []).map((l) => [normalizeName(l.name), l]));
  return { locById, locByName };
}

/** Résout locationId + locationName à partir du produit et du référentiel emplacements. */
function resolveProductPlacement(product, locById, locByName) {
  let locId = productLocationId(product);
  let locationName = String(product?.locationName || '').trim();
  if (!locationName && product?.locationId && typeof product.locationId === 'object' && product.locationId.name) {
    locationName = String(product.locationId.name).trim();
  }
  let loc = locId ? locById.get(String(locId)) : null;
  if (!loc && locationName) {
    loc = locByName.get(normalizeName(locationName)) || null;
    if (loc) locId = loc._id;
  }
  if (loc) locationName = loc.name;
  return { locationId: locId || null, locationName };
}

function resolvePlacementFromItem(item, locById, locByName) {
  let locationId = normalizeLocationId(item.locationId);
  let locationName = String(item.locationName || '').trim();
  if (locationId) {
    const loc = locById.get(String(locationId));
    if (loc) locationName = loc.name;
    else locationId = null;
  }
  if (!locationId && locationName) {
    const loc = locByName.get(normalizeName(locationName));
    if (loc) {
      locationId = loc._id;
      locationName = loc.name;
    }
  }
  return { locationId, locationName };
}

/** Codes TGT avec ou sans zéros en tête (010583 ↔ 10583). */
function normalizeSupplierCode(code) {
  const s = String(code || '').trim();
  if (!s) return '';
  const stripped = s.replace(/^0+/, '');
  return stripped || '0';
}

function setCodeQty(maps, code, qty) {
  const c = String(code || '').trim();
  if (!c) return;
  maps.byCode.set(c, qty);
  const norm = normalizeSupplierCode(c);
  if (norm && norm !== c) maps.byCode.set(norm, qty);
}

/** Vendredi de la semaine de commande en cours (commande lundi → livraison vendredi). */
function getCurrentDeliveryFriday(refDate = new Date()) {
  const d = new Date(refDate);
  d.setHours(12, 0, 0, 0);
  const day = d.getDay();
  let daysUntilFriday = (5 - day + 7) % 7;
  if (day === 6) daysUntilFriday = 6;
  if (day === 0) daysUntilFriday = 5;
  const friday = new Date(d);
  friday.setDate(d.getDate() + daysUntilFriday);
  friday.setHours(0, 0, 0, 0);
  return friday;
}

function deliveryWeekKey(friday) {
  const y = friday.getFullYear();
  const m = String(friday.getMonth() + 1).padStart(2, '0');
  const day = String(friday.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

async function ensureDefaultLocations(siteKey, supplier = SUPPLIER_TGT) {
  const s = parseSupplier(supplier);
  const count = await SupplierOrderLocation.countDocuments(catalogQuery(siteKey, s));
  if (count > 0) return;
  const defaults = s === SUPPLIER_MILLANGE ? ['Surgelé'] : DEFAULT_LOCATIONS;
  const docs = defaults.map((name, idx) => ({
    siteKey,
    supplier: s,
    name,
    order: idx,
    isActive: true
  }));
  await SupplierOrderLocation.insertMany(docs, { ordered: false });
}

async function getLastSubmittedOrder(siteKey) {
  return SupplierOrder.findOne({ siteKey, status: 'submitted' }).sort({ deliveryDate: -1, updatedAt: -1 });
}

function emptyQtyMaps() {
  return { byProductId: new Map(), byName: new Map(), byCode: new Map() };
}

function mapsFromOrderLines(orderLines) {
  const maps = emptyQtyMaps();
  for (const line of orderLines || []) {
    const qty = line.orderQty ?? 0;
    if (line.productId) maps.byProductId.set(String(line.productId), qty);
    if (line.supplierCode) setCodeQty(maps, line.supplierCode, qty);
    if (line.productName) maps.byName.set(normalizeName(line.productName), qty);
  }
  return maps;
}

function mapsFromDeliveryLines(deliveryLines) {
  const maps = emptyQtyMaps();
  for (const line of deliveryLines || []) {
    const qty = line.orderedQty ?? line.receivedQty;
    if (qty == null) continue;
    const n = Number(qty);
    if (!Number.isFinite(n)) continue;
    if (line.supplierCode) setCodeQty(maps, line.supplierCode, n);
    if (line.productName) maps.byName.set(normalizeName(line.productName), n);
  }
  return maps;
}

function mergeMapsGaps(target, source) {
  if (!source) return;
  for (const [k, v] of source.byCode) {
    if (!target.byCode.has(k)) target.byCode.set(k, v);
  }
  for (const [k, v] of source.byName) {
    if (!target.byName.has(k)) target.byName.set(k, v);
  }
  for (const [k, v] of source.byProductId) {
    if (!target.byProductId.has(k)) target.byProductId.set(k, v);
  }
}

function mapsIsEmpty(maps) {
  return !maps.byCode.size && !maps.byName.size && !maps.byProductId.size;
}

async function fillMinus1GapsFromDeliveries(siteKey, maps, supplier = SUPPLIER_TGT) {
  const deliveries = await SupplierOrderDelivery.find(deliveryQuery(siteKey, supplier))
    .sort({ createdAt: -1 })
    .limit(15)
    .select('lines');

  for (const del of deliveries) {
    for (const line of del.lines || []) {
      const qty = line.orderedQty ?? line.receivedQty;
      if (qty == null) continue;
      const n = Number(qty);
      if (!Number.isFinite(n)) continue;
      const code = String(line.supplierCode || '').trim();
      const nk = normalizeName(line.productName);
      if (code) {
        const norm = normalizeSupplierCode(code);
        if (!maps.byCode.has(code) && !maps.byCode.has(norm)) setCodeQty(maps, code, n);
      }
      if (nk && !maps.byName.has(nk)) maps.byName.set(nk, n);
    }
  }
}

/** Quantités de référence extraites du catalogue seed Arras (PDF). */
function loadSeedQtyMaps(siteKey, supplier = SUPPLIER_TGT) {
  const maps = emptyQtyMaps();
  if (siteKey !== 'plan' || parseSupplier(supplier) !== SUPPLIER_TGT) return maps;
  try {
    const seedPath = path.join(__dirname, '../data/tgt-arras-catalog-seed.json');
    if (!fs.existsSync(seedPath)) return maps;
    const seed = JSON.parse(fs.readFileSync(seedPath, 'utf8'));
    for (const p of seed.products || []) {
      if (p.lastOrderQty == null) continue;
      const n = Number(p.lastOrderQty);
      if (!Number.isFinite(n)) continue;
      if (p.supplierCode) setCodeQty(maps, p.supplierCode, n);
      if (p.name) maps.byName.set(normalizeName(p.name), n);
    }
  } catch (e) {
    console.warn('loadSeedQtyMaps:', e.message);
  }
  return maps;
}

/** Date BL (jj/mm/aaaa ou jj.mm.aaaa) → timestamp pour tri. */
function parseBlDateString(value) {
  const raw = String(value || '').trim();
  if (!raw) return 0;
  const parts = raw.split(/[/.-]/).map((p) => parseInt(p, 10));
  if (parts.length === 3 && parts.every((n) => Number.isFinite(n))) {
    const [day, month, year] = parts;
    const y = year < 100 ? 2000 + year : year;
    return new Date(y, month - 1, day).getTime();
  }
  const t = Date.parse(raw);
  return Number.isFinite(t) ? t : 0;
}

function deliveryBlSortKey(del) {
  return (
    parseBlDateString(del.orderDate) ||
    parseBlDateString(del.receptionDate) ||
    new Date(del.createdAt || 0).getTime()
  );
}

function findPdfProductHit(line, pdfProducts) {
  const code = String(line.supplierCode || '').trim();
  const nk = normalizeName(line.productName);
  for (const p of pdfProducts) {
    const pc = String(p.supplierCode || '').trim();
    if (code && pc && (pc === code || normalizeSupplierCode(pc) === normalizeSupplierCode(code))) {
      return p;
    }
    if (nk && normalizeName(p.name) === nk) return p;
  }
  return null;
}

async function getDeliveriesSortedByBlDate(siteKey, limit = 20, supplier = SUPPLIER_TGT) {
  const all = await SupplierOrderDelivery.find(deliveryQuery(siteKey, supplier)).select(
    'lines orderDate receptionDate orderNumber createdAt'
  );
  const sorted = all.sort((a, b) => deliveryBlSortKey(b) - deliveryBlSortKey(a));
  const byOrderNumber = new Map();
  for (const del of sorted) {
    const key = String(del.orderNumber || del._id);
    if (!byOrderNumber.has(key)) byOrderNumber.set(key, del);
  }
  return [...byOrderNumber.values()]
    .sort((a, b) => deliveryBlSortKey(b) - deliveryBlSortKey(a))
    .slice(0, limit);
}

function blMetaFromDelivery(del) {
  if (!del) return null;
  return {
    orderDate: del.orderDate || '',
    receptionDate: del.receptionDate || '',
    orderNumber: del.orderNumber || '',
    source: 'bl'
  };
}

/** Cmd -1 … -6 : N derniers BL (date commande), puis commandes validées, puis seed sur cmd -1. */
async function buildOrderHistoryMaps(siteKey, supplier = SUPPLIER_TGT) {
  const s = parseSupplier(supplier);
  const [deliveries, submitted] = await Promise.all([
    getDeliveriesSortedByBlDate(siteKey, CMD_HISTORY_DEPTH, s),
    SupplierOrder.find({ siteKey, supplier: s, status: 'submitted' })
      .sort({ deliveryDate: -1, updatedAt: -1 })
      .limit(CMD_HISTORY_DEPTH)
      .select('lines deliveryDate deliveryWeekKey supplier')
  ]);

  const seedMaps = loadSeedQtyMaps(siteKey, s);
  const tiers = Array.from({ length: CMD_HISTORY_DEPTH }, () => emptyQtyMaps());
  const tierMeta = Array(CMD_HISTORY_DEPTH).fill(null);

  for (let i = 0; i < CMD_HISTORY_DEPTH; i++) {
    if (deliveries[i]?.lines?.length) {
      tiers[i] = mapsFromDeliveryLines(deliveries[i].lines);
      tierMeta[i] = blMetaFromDelivery(deliveries[i]);
    }
  }

  for (let i = 0; i < CMD_HISTORY_DEPTH; i++) {
    if (!mapsIsEmpty(tiers[i]) || !submitted[i]?.lines?.length) continue;
    tiers[i] = mapsFromOrderLines(submitted[i].lines);
    tierMeta[i] = {
      deliveryDate: submitted[i].deliveryDate,
      deliveryWeekKey: submitted[i].deliveryWeekKey,
      source: 'submitted'
    };
  }

  if (!deliveries.length && s === SUPPLIER_TGT) {
    mergeMapsGaps(tiers[0], seedMaps);
  }

  return {
    tiers,
    tierMeta,
    deliveries,
    minus1: tiers[0],
    minus2: tiers[1],
    minus1Meta: tierMeta[0],
    minus2Meta: tierMeta[1]
  };
}

function tierMetaDate(meta) {
  if (!meta) return null;
  return meta.orderDate || meta.receptionDate || meta.deliveryDate || null;
}

function buildCmdHistoryResponseMeta(history, lines) {
  const cmdFilled = CMD_QTY_FIELDS.map((f) => lines.filter((l) => l[f] != null).length);
  const cmdBlNumbers = history.tierMeta.map((m) => m?.orderNumber || null);
  const cmdDates = history.tierMeta.map((m) => tierMetaDate(m));
  return {
    cmdFilled,
    cmdBlNumbers,
    cmdDates,
    blCount: history.deliveries?.length ?? 0,
    lastOrderFilled: cmdFilled[0],
    prevOrderFilled: cmdFilled[1],
    lastSubmittedDelivery: cmdDates[0],
    prevSubmittedDelivery: cmdDates[1],
    cmd1BlNumber: cmdBlNumbers[0],
    cmd2BlNumber: cmdBlNumbers[1]
  };
}

function productRefFromLine(line) {
  return {
    _id: line.productId,
    name: line.productName,
    supplierCode: line.supplierCode
  };
}

/** Applique cmd -1 … -6 depuis l’historique BL (un BL par colonne). */
function applyCmdColumnsFromHistory(lines, history, { overwrite = true } = {}) {
  const tierMaps = history.tiers || [history.minus1, history.minus2];
  return (lines || []).map((raw) => {
    const line = typeof raw.toObject === 'function' ? raw.toObject() : { ...raw };
    const product = productRefFromLine(line);
    const updates = { ...line };

    for (let i = 0; i < CMD_HISTORY_DEPTH; i++) {
      const field = CMD_QTY_FIELDS[i];
      const from = resolveQtyFromMaps(product, tierMaps[i] || emptyQtyMaps(), line, field, false);
      let val = line[field];
      if (overwrite) {
        val = from != null ? from : null;
      } else if (val == null && from != null) {
        val = from;
      }
      updates[field] = val;
    }

    return computeLineMetrics(updates);
  });
}

function resolveQtyFromMaps(product, maps, prevLine, prevField, usePrevFallback = false) {
  const code = String(product.supplierCode || '').trim();
  let fromHistory = maps.byProductId.get(String(product._id)) ?? null;
  if (fromHistory == null && code) {
    fromHistory =
      maps.byCode.get(code) ??
      maps.byCode.get(normalizeSupplierCode(code)) ??
      null;
  }
  if (fromHistory == null) {
    fromHistory = maps.byName.get(normalizeName(product.name)) ?? null;
  }
  if (fromHistory != null) return fromHistory;
  if (usePrevFallback && prevLine?.[prevField] != null) return prevLine[prevField];
  return null;
}

function orderLinesStructureChanged(merged, existing) {
  if ((merged?.length || 0) !== (existing?.length || 0)) return true;
  const existingIds = new Set((existing || []).map((l) => String(l.productId)));
  return merged.some((l) => !existingIds.has(String(l.productId)));
}

/** Conserve saisie brouillon (reçu, stock, dernière cmd…) lors d’un rattachement au catalogue. */
function mergeCatalogWithExistingOrder(catalogLines, existingLines) {
  const prevById = new Map();
  for (const raw of existingLines || []) {
    const prev = typeof raw.toObject === 'function' ? raw.toObject() : { ...raw };
    if (prev.productId) prevById.set(String(prev.productId), prev);
  }
  return (catalogLines || []).map((line) => {
    const prev = prevById.get(String(line.productId));
    if (!prev) return line;
    return computeLineMetrics({
      ...line,
      receivedQty: prev.receivedQty != null ? prev.receivedQty : line.receivedQty,
      cartonQty: prev.cartonQty != null ? prev.cartonQty : line.cartonQty,
      unitQty: prev.unitQty != null ? prev.unitQty : line.unitQty,
      stockQty: prev.stockQty != null ? prev.stockQty : line.stockQty,
      orderQty: prev.orderQty != null ? prev.orderQty : line.orderQty,
      consumptionQty: prev.consumptionQty != null ? prev.consumptionQty : line.consumptionQty,
      suggestedOrderQty:
        prev.suggestedOrderQty != null ? prev.suggestedOrderQty : line.suggestedOrderQty,
      avgConsumptionQty:
        prev.avgConsumptionQty != null ? prev.avgConsumptionQty : line.avgConsumptionQty
    });
  });
}

function numOrNull(v) {
  if (v === '' || v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? Math.max(0, n) : null;
}

const ROLLING_WEEKS = 3;

/** Quantité « reçue » pour la conso : saisie BL courante, sinon Cmd -1 (dernier BL). */
function effectiveReceivedForConsumption(line) {
  const received = numOrNull(line.receivedQty);
  if (received != null) return received;
  return numOrNull(line.lastOrderQty);
}

/** Consommation = reçu effectif − stock ; prévision = moyenne glissante 3 sem. si dispo, sinon conso semaine. */
function computeLineMetrics(line, avgConsumptionQty = null) {
  const receivedQty = numOrNull(line.receivedQty);
  const { cartonQty, unitQty } = normalizeStockFields(line);
  const stockTotal = effectiveStockTotal(line);
  const receivedForConso = effectiveReceivedForConsumption(line);
  let consumptionQty = numOrNull(line.consumptionQty);
  const avg =
    avgConsumptionQty != null
      ? avgConsumptionQty
      : numOrNull(line.avgConsumptionQty);

  if (receivedForConso != null && stockTotal != null) {
    consumptionQty = Math.max(0, receivedForConso - stockTotal);
  }

  let suggestedOrderQty = null;
  if (avg != null && avg > 0) {
    suggestedOrderQty = Math.ceil(avg);
  } else if (consumptionQty != null) {
    suggestedOrderQty = Math.ceil(consumptionQty);
  }

  return {
    ...line,
    receivedQty,
    cartonQty,
    unitQty,
    stockQty: null,
    consumptionQty,
    avgConsumptionQty: avg != null ? Math.round(avg * 100) / 100 : null,
    suggestedOrderQty,
    lastOrderQty: line.lastOrderQty == null ? null : Number(line.lastOrderQty) || 0,
    prevOrderQty: line.prevOrderQty == null ? null : Number(line.prevOrderQty) || 0,
    cmdQty3: line.cmdQty3 == null ? null : Number(line.cmdQty3) || 0,
    cmdQty4: line.cmdQty4 == null ? null : Number(line.cmdQty4) || 0,
    cmdQty5: line.cmdQty5 == null ? null : Number(line.cmdQty5) || 0,
    cmdQty6: line.cmdQty6 == null ? null : Number(line.cmdQty6) || 0,
    orderQty: Math.max(0, Number(line.orderQty) || 0)
  };
}

function lineHistoryKey(line) {
  if (line.productId) return `id:${line.productId}`;
  if (line.supplierCode) return `code:${line.supplierCode}`;
  if (line.productName) return `name:${normalizeName(line.productName)}`;
  return null;
}

/** Moyenne de consommation sur les N dernières commandes validées (une valeur max par semaine). */
async function buildRollingConsumptionMap(siteKey, excludeWeekKey, weeks = ROLLING_WEEKS) {
  const orders = await SupplierOrder.find({
    siteKey,
    status: 'submitted',
    ...(excludeWeekKey ? { deliveryWeekKey: { $ne: excludeWeekKey } } : {})
  })
    .sort({ deliveryDate: -1, updatedAt: -1 })
    .limit(weeks)
    .select('lines deliveryWeekKey');

  const byKey = new Map();

  for (const order of orders) {
    const seenThisOrder = new Set();
    for (const raw of order.lines || []) {
      const line = typeof raw.toObject === 'function' ? raw.toObject() : raw;
      let consumptionQty = numOrNull(line.consumptionQty);
      if (consumptionQty == null) {
        const received = effectiveReceivedForConsumption(line);
        const stock = effectiveStockTotal(line);
        if (received != null && stock != null) {
          consumptionQty = Math.max(0, received - stock);
        }
      }
      if (consumptionQty == null) continue;

      const key = lineHistoryKey(line);
      if (!key || seenThisOrder.has(key)) continue;
      seenThisOrder.add(key);
      if (!byKey.has(key)) byKey.set(key, []);
      byKey.get(key).push(consumptionQty);
    }
  }

  const averages = new Map();
  for (const [key, values] of byKey.entries()) {
    if (!values.length) continue;
    averages.set(key, values.reduce((a, b) => a + b, 0) / values.length);
  }

  return { averages, historyWeeks: orders.length };
}

function resolveRollingAvg(line, rollingMap) {
  if (!rollingMap?.averages?.size) return null;
  const keys = [];
  if (line.productId) keys.push(`id:${line.productId}`);
  if (line.supplierCode) keys.push(`code:${line.supplierCode}`);
  if (line.productName) keys.push(`name:${normalizeName(line.productName)}`);
  for (const k of keys) {
    if (rollingMap.averages.has(k)) return rollingMap.averages.get(k);
  }
  return null;
}

async function enrichLines(siteKey, lines) {
  const weekKey = deliveryWeekKey(getCurrentDeliveryFriday());
  const rolling = await buildRollingConsumptionMap(siteKey, weekKey, ROLLING_WEEKS);
  return (lines || []).map((l) => {
    const plain = typeof l.toObject === 'function' ? l.toObject() : { ...l };
    const avg = resolveRollingAvg(plain, rolling);
    return computeLineMetrics(plain, avg);
  });
}

function sanitizeLine(l, avgConsumptionQty = null) {
  return computeLineMetrics({
    productId: l.productId,
    productName: String(l.productName || '').trim(),
    supplierCode: String(l.supplierCode || '').trim(),
    locationId: l.locationId || null,
    locationName: String(l.locationName || '').trim(),
    receivedQty: l.receivedQty,
    ...sanitizeStockPayload(l),
    consumptionQty: l.consumptionQty,
    suggestedOrderQty: l.suggestedOrderQty,
    lastOrderQty: l.lastOrderQty,
    prevOrderQty: l.prevOrderQty,
    cmdQty3: l.cmdQty3,
    cmdQty4: l.cmdQty4,
    cmdQty5: l.cmdQty5,
    cmdQty6: l.cmdQty6,
    orderQty: l.orderQty
  }, avgConsumptionQty);
}

/** Rattache la commande au catalogue (emplacements produits + cmd historique). */
async function reconcileCurrentOrderLines(
  siteKey,
  existingLines = [],
  { overwriteCmd = true, supplier = SUPPLIER_TGT } = {}
) {
  const built = await buildLinesFromCatalog(siteKey, existingLines, {
    fillEmptyCmdOnly: true,
    supplier
  });
  let merged = mergeCatalogWithExistingOrder(built, existingLines);
  const history = await buildOrderHistoryMaps(siteKey, supplier);
  merged = applyCmdColumnsFromHistory(merged, history, { overwrite: overwriteCmd });
  return enrichLines(siteKey, merged);
}

async function upsertCurrentOrder(siteKey, lines, extra = {}, supplier = SUPPLIER_TGT) {
  const s = parseSupplier(supplier);
  const deliveryDate = getCurrentDeliveryFriday();
  const weekKey = deliveryWeekKey(deliveryDate);
  const enriched = await enrichLines(siteKey, lines);
  return SupplierOrder.findOneAndUpdate(
    orderQuery(siteKey, weekKey, s),
    {
      siteKey,
      supplier: s,
      deliveryWeekKey: weekKey,
      deliveryDate,
      status: 'draft',
      lines: enriched,
      ...extra
    },
    { upsert: true, new: true }
  );
}

const formatEmployeeStockImportDate = (d) => {
  if (!d) return '';
  try {
    return new Date(d).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return '';
  }
};

async function buildEmployeeStockImportMeta(siteKey, entryIds = []) {
  const ids = (entryIds || []).filter(Boolean);
  if (!ids.length) return [];
  const entries = await TgtStockEntry.find({ siteKey, _id: { $in: ids } })
    .sort({ createdAt: 1 })
    .select('employeeName createdAt itemsCount')
    .lean();
  return entries.map((e) => ({
    entryId: e._id,
    employeeName: e.employeeName || '',
    createdAt: e.createdAt,
    itemsCount: e.itemsCount ?? (e.items?.length || 0),
    dateLabel: formatEmployeeStockImportDate(e.createdAt)
  }));
}

/**
 * Construit les stocks saisis par les salariés en mode "remplacement".
 * Si plusieurs imports sont sélectionnés, le plus récent (ordre createdAt asc)
 * écrase les quantités précédentes produit par produit (pas de cumul).
 */
function buildEmployeeStockByProductReplace(entries = []) {
  const stockByProductId = new Map();
  for (const entry of entries) {
    for (const item of entry.items || []) {
      if (item.productId == null || !hasAnyStockValue(item)) continue;
      const pid = String(item.productId);
      const { cartonQty, unitQty } = normalizeStockFields(item);
      stockByProductId.set(pid, { cartonQty, unitQty });
    }
  }
  return stockByProductId;
}

async function buildLinesFromCatalog(siteKey, existingLines = [], options = {}) {
  const applyHistory = options.applyHistory === true;
  const fillEmptyCmdOnly = options.fillEmptyCmdOnly === true;
  const supplier = parseSupplier(options.supplier);
  const [products, locations, history] = await Promise.all([
    SupplierOrderProduct.find({ ...catalogQuery(siteKey, supplier), isActive: true }).sort({
      order: 1,
      name: 1
    }),
    SupplierOrderLocation.find({ ...catalogQuery(siteKey, supplier), isActive: true }).sort({
      order: 1,
      name: 1
    }),
    buildOrderHistoryMaps(siteKey, supplier)
  ]);

  const { locById, locByName } = buildLocationMaps(locations);
  const receivedFromLastByProductId = history.minus1.byProductId;
  const receivedFromLastByCode = history.minus1.byCode;
  const receivedFromLastByName = history.minus1.byName;

  const existingByProductId = new Map(
    (existingLines || []).map((l) => {
      const plain = typeof l.toObject === 'function' ? l.toObject() : l;
      return [String(plain.productId), plain];
    })
  );

  return products.map((p) => {
    const prev = existingByProductId.get(String(p._id));
    const { locationId: locId, locationName } = resolveProductPlacement(p, locById, locByName);
    const code = p.supplierCode || '';
    const receivedDefault =
      receivedFromLastByProductId.get(String(p._id)) ??
      (code ? receivedFromLastByCode.get(code) : null) ??
      receivedFromLastByName.get(normalizeName(p.name)) ??
      null;

    const cmdValues = {};
    for (let i = 0; i < CMD_HISTORY_DEPTH; i++) {
      const field = CMD_QTY_FIELDS[i];
      let val = prev?.[field] ?? null;
      if (applyHistory) {
        val = resolveQtyFromMaps(p, history.tiers[i], prev, field, false);
      } else if (fillEmptyCmdOnly && val == null) {
        val = resolveQtyFromMaps(p, history.tiers[i], prev, field, true);
      }
      cmdValues[field] = val;
    }

    return computeLineMetrics({
      productId: p._id,
      productName: p.name,
      productOrder: p.order ?? 0,
      supplierCode: code,
      locationId: locId || null,
      locationName,
      receivedQty: prev?.receivedQty ?? receivedDefault,
      ...sanitizeStockPayload(prev || {}),
      ...cmdValues,
      orderQty: prev?.orderQty ?? 0,
      consumptionQty: prev?.consumptionQty ?? null,
      suggestedOrderQty: prev?.suggestedOrderQty ?? null
    });
  });
}

async function getPositiveStockMap() {
  const scan = await PositiveScan.findOne().sort({ createdAt: -1 });
  const map = new Map();
  if (!scan?.totals?.length) return map;
  for (const t of scan.totals) {
    const key = normalizeName(t.name);
    if (!key) continue;
    map.set(key, (map.get(key) || 0) + (Number(t.count) || 0));
  }
  return map;
}

function matchPositiveCount(productName, positiveMap, catalogProducts) {
  const n = normalizeName(productName);
  if (positiveMap.has(n)) return positiveMap.get(n);

  for (const p of catalogProducts || []) {
    const canon = normalizeName(p.canonical);
    if (canon === n && positiveMap.has(canon)) return positiveMap.get(canon);
    for (const alias of p.aliases || []) {
      const a = normalizeName(alias);
      if (a === n && positiveMap.has(a)) return positiveMap.get(a);
      if (a === n && positiveMap.has(canon)) return positiveMap.get(canon);
    }
    if (canon && n.includes(canon) && positiveMap.has(canon)) return positiveMap.get(canon);
  }
  return null;
}

// ─── Locations ───

const getLocations = async (req, res) => {
  try {
    const siteKey = parseSiteKey(req.query.siteKey);
    const supplier = getSupplierFromReq(req);
    if (!siteKey) return res.status(400).json({ success: false, error: 'siteKey requis (lon|plan)' });
    await ensureDefaultLocations(siteKey, supplier);
    const locations = await SupplierOrderLocation.find(catalogQuery(siteKey, supplier)).sort({
      order: 1,
      name: 1
    });
    res.json({ success: true, data: locations });
  } catch (e) {
    console.error('getLocations', e);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

const putLocations = async (req, res) => {
  try {
    const siteKey = parseSiteKey(req.body?.siteKey);
    const supplier = getSupplierFromReq(req);
    const items = req.body?.items;
    if (!siteKey) return res.status(400).json({ success: false, error: 'siteKey requis' });
    if (!Array.isArray(items)) return res.status(400).json({ success: false, error: 'items requis' });

    for (const [idx, item] of items.entries()) {
      const name = String(item.name || '').trim();
      if (!name) continue;
      const payload = {
        siteKey,
        supplier,
        name,
        order: Number(item.order ?? idx),
        isActive: item.isActive !== false
      };
      if (item._id) {
        await SupplierOrderLocation.findOneAndUpdate({ _id: item._id, siteKey, supplier }, payload);
      } else {
        await SupplierOrderLocation.findOneAndUpdate(
          { siteKey, supplier, name },
          payload,
          { upsert: true }
        );
      }
    }

    const locations = await SupplierOrderLocation.find(catalogQuery(siteKey, supplier)).sort({
      order: 1,
      name: 1
    });
    res.json({ success: true, data: locations });
  } catch (e) {
    console.error('putLocations', e);
    res.status(500).json({ success: false, error: e.message || 'Erreur serveur' });
  }
};

// ─── Products ───

const getProducts = async (req, res) => {
  try {
    const siteKey = parseSiteKey(req.query.siteKey);
    const supplier = getSupplierFromReq(req);
    if (!siteKey) return res.status(400).json({ success: false, error: 'siteKey requis' });
    await ensureDefaultLocations(siteKey, supplier);
    const products = await SupplierOrderProduct.find(catalogQuery(siteKey, supplier))
      .populate('locationId', 'name order')
      .sort({ order: 1, name: 1 });
    res.json({ success: true, data: products });
  } catch (e) {
    console.error('getProducts', e);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

const putProducts = async (req, res) => {
  try {
    const siteKey = parseSiteKey(req.body?.siteKey);
    const supplier = getSupplierFromReq(req);
    const items = req.body?.items;
    if (!siteKey) return res.status(400).json({ success: false, error: 'siteKey requis' });
    if (!Array.isArray(items)) return res.status(400).json({ success: false, error: 'items requis' });

    const allLocations = await SupplierOrderLocation.find(catalogQuery(siteKey, supplier));
    const { locById, locByName } = buildLocationMaps(allLocations);

    for (const [idx, item] of items.entries()) {
      const name = String(item.name || '').trim();
      if (!name) continue;
      const { locationId, locationName } = resolvePlacementFromItem(item, locById, locByName);
      const existing = await findSupplierProductForSave(siteKey, supplier, item);
      const payload = {
        siteKey,
        supplier,
        name,
        supplierCode:
          String(item.supplierCode || '').trim() || String(existing?.supplierCode || '').trim(),
        locationId,
        locationName,
        unit: String(item.unit || 'pièce').trim(),
        targetStock: item.targetStock != null && item.targetStock !== '' ? Number(item.targetStock) : null,
        order: Number(item.order ?? idx),
        isActive: item.isActive !== false
      };
      const filter = existing ? { _id: existing._id } : { siteKey, supplier, name };
      await SupplierOrderProduct.updateOne(filter, { $set: payload }, {
        upsert: !existing,
        runValidators: true
      });
    }

    const deliveryDate = getCurrentDeliveryFriday();
    const weekKey = deliveryWeekKey(deliveryDate);
    const order = await SupplierOrder.findOne(orderQuery(siteKey, weekKey, supplier));
    if (order) {
      const existingPlain = (order.lines || []).map((l) =>
        typeof l.toObject === 'function' ? l.toObject() : { ...l }
      );
      order.lines = await reconcileCurrentOrderLines(siteKey, existingPlain, { supplier });
      order.markModified('lines');
      await order.save();
    }

    const products = await SupplierOrderProduct.find(catalogQuery(siteKey, supplier))
      .populate('locationId', 'name order')
      .sort({ order: 1, name: 1 });
    res.json({ success: true, data: products });
  } catch (e) {
    console.error('putProducts', e);
    res.status(500).json({ success: false, error: e.message || 'Erreur serveur' });
  }
};

/** Import initial : { name, supplierCode?, lastOrderQty?, locationName? }[] */
const importProducts = async (req, res) => {
  try {
    const siteKey = parseSiteKey(req.body?.siteKey);
    const rows = req.body?.products;
    if (!siteKey) return res.status(400).json({ success: false, error: 'siteKey requis' });
    if (!Array.isArray(rows) || !rows.length) {
      return res.status(400).json({ success: false, error: 'products[] requis' });
    }

    const supplier = getSupplierFromReq(req);
    await ensureDefaultLocations(siteKey, supplier);
    const locations = await SupplierOrderLocation.find(catalogQuery(siteKey, supplier));
    const { locById, locByName } = buildLocationMaps(locations);

    let imported = 0;
    for (const [idx, row] of rows.entries()) {
      const name = String(row.name || row.productName || '').trim();
      if (!name) continue;
      const { locationId, locationName } = resolvePlacementFromItem(row, locById, locByName);
      const existing = await findSupplierProductForSave(siteKey, supplier, {
        _id: row._id,
        name,
        supplierCode: row.supplierCode || row.code
      });
      const payload = {
        siteKey,
        supplier,
        name,
        supplierCode:
          String(row.supplierCode || row.code || '').trim() ||
          String(existing?.supplierCode || '').trim(),
        locationId,
        locationName,
        order: Number(row.order ?? idx),
        isActive: row.isActive !== false
      };
      const filter = existing ? { _id: existing._id } : { siteKey, supplier, name };
      await SupplierOrderProduct.updateOne(filter, { $set: payload }, {
        upsert: !existing,
        runValidators: true
      });
      imported += 1;
    }

    const products = await SupplierOrderProduct.find(catalogQuery(siteKey, supplier))
      .populate('locationId', 'name order')
      .sort({ order: 1, name: 1 });
    res.json({ success: true, imported, data: products });
  } catch (e) {
    console.error('importProducts', e);
    res.status(500).json({ success: false, error: e.message || 'Erreur serveur' });
  }
};

// ─── Commande courante ───

const getCurrentOrder = async (req, res) => {
  try {
    const siteKey = parseSiteKey(req.query.siteKey);
    const supplier = getSupplierFromReq(req);
    if (!siteKey) return res.status(400).json({ success: false, error: 'siteKey requis' });

    await ensureDefaultLocations(siteKey, supplier);
    const deliveryDate = getCurrentDeliveryFriday();
    const weekKey = deliveryWeekKey(deliveryDate);

    let order = await SupplierOrder.findOne(orderQuery(siteKey, weekKey, supplier));
    if (!order) {
      const lines = await enrichLines(
        siteKey,
        await buildLinesFromCatalog(siteKey, [], { supplier })
      );
      order = await SupplierOrder.create({
        siteKey,
        supplier,
        deliveryWeekKey: weekKey,
        deliveryDate,
        status: 'draft',
        lines
      });
    } else {
      const existingPlain = (order.lines || []).map((l) =>
        typeof l.toObject === 'function' ? l.toObject() : { ...l }
      );
      order.lines = await reconcileCurrentOrderLines(siteKey, existingPlain, { supplier });
      order.markModified('lines');
      await order.save();
    }

    const [history, lastDelivery, employeeStockImports] = await Promise.all([
      buildOrderHistoryMaps(siteKey, supplier),
      SupplierOrderDelivery.findOne(deliveryQuery(siteKey, supplier))
        .sort({ createdAt: -1 })
        .select('orderNumber orderDate receptionDate fileName createdAt'),
      buildEmployeeStockImportMeta(siteKey, order.employeeStockEntryIds || [])
    ]);
    const rolling = await buildRollingConsumptionMap(siteKey, weekKey, ROLLING_WEEKS);

    res.json({
      success: true,
      data: order,
      meta: {
        deliveryDate: order.deliveryDate,
        deliveryWeekKey: order.deliveryWeekKey,
        ...buildCmdHistoryResponseMeta(history, order.lines || []),
        lastDeliveryBl: lastDelivery || null,
        rollingWeeksUsed: rolling.historyWeeks,
        rollingWeeksTarget: ROLLING_WEEKS,
        employeeStockImports
      }
    });
  } catch (e) {
    console.error('getCurrentOrder', e);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

const saveCurrentOrder = async (req, res) => {
  try {
    const siteKey = parseSiteKey(req.body?.siteKey);
    const supplier = getSupplierFromReq(req);
    const lines = req.body?.lines;
    const note = req.body?.note;
    const createdByName = String(req.body?.createdByName || req.user?.name || '').trim();

    if (!siteKey) return res.status(400).json({ success: false, error: 'siteKey requis' });
    if (!Array.isArray(lines)) return res.status(400).json({ success: false, error: 'lines requis' });

    const deliveryDate = getCurrentDeliveryFriday();
    const weekKey = deliveryWeekKey(deliveryDate);

    const rolling = await buildRollingConsumptionMap(siteKey, weekKey, ROLLING_WEEKS);
    const sanitized = lines.map((l) => {
      const plain = { ...l };
      const avg = resolveRollingAvg(plain, rolling);
      return sanitizeLine(plain, avg);
    });

    const order = await SupplierOrder.findOneAndUpdate(
      orderQuery(siteKey, weekKey, supplier),
      {
        siteKey,
        supplier,
        deliveryWeekKey: weekKey,
        deliveryDate,
        status: 'draft',
        lines: sanitized,
        ...(note != null ? { note: String(note).slice(0, 500) } : {}),
        ...(createdByName ? { createdByName } : {})
      },
      { upsert: true, new: true }
    );

    res.json({ success: true, data: order });
  } catch (e) {
    console.error('saveCurrentOrder', e);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

const submitCurrentOrder = async (req, res) => {
  try {
    const siteKey = parseSiteKey(req.body?.siteKey);
    const supplier = getSupplierFromReq(req);
    const submittedByName = String(req.body?.submittedByName || req.user?.name || '').trim();
    if (!siteKey) return res.status(400).json({ success: false, error: 'siteKey requis' });

    const deliveryDate = getCurrentDeliveryFriday();
    const weekKey = deliveryWeekKey(deliveryDate);

    const order = await SupplierOrder.findOne(orderQuery(siteKey, weekKey, supplier));
    if (!order) return res.status(404).json({ success: false, error: 'Aucune commande en cours' });

    order.lines = await enrichLines(siteKey, order.lines || []);
    order.status = 'submitted';
    order.orderPlacedDate = new Date();
    order.submittedByName = submittedByName;
    await order.save();

    res.json({ success: true, data: order });
  } catch (e) {
    console.error('submitCurrentOrder', e);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

const refreshLastOrderQty = async (req, res) => {
  try {
    const siteKey = parseSiteKey(req.body?.siteKey);
    const supplier = getSupplierFromReq(req);
    if (!siteKey) return res.status(400).json({ success: false, error: 'siteKey requis' });

    const deliveryDate = getCurrentDeliveryFriday();
    const weekKey = deliveryWeekKey(deliveryDate);
    let order = await SupplierOrder.findOne(orderQuery(siteKey, weekKey, supplier));

    let existingPlain = (order?.lines || []).map((l) =>
      typeof l.toObject === 'function' ? l.toObject() : { ...l }
    );
    if (!existingPlain.length) {
      existingPlain = await buildLinesFromCatalog(siteKey, [], { fillEmptyCmdOnly: true, supplier });
    }

    let lines = await reconcileCurrentOrderLines(siteKey, existingPlain, { supplier });
    const history = await buildOrderHistoryMaps(siteKey, supplier);

    if (!lines.length) {
      return res.status(400).json({
        success: false,
        error: 'Aucune ligne de commande — chargez le catalogue ou importez un BL.'
      });
    }
    if (order) {
      order.lines = lines;
      await order.save();
    } else {
      order = await SupplierOrder.create({
        siteKey,
        supplier,
        deliveryWeekKey: weekKey,
        deliveryDate,
        status: 'draft',
        lines
      });
    }
    res.json({
      success: true,
      data: order,
      meta: {
        totalLines: lines.length,
        ...buildCmdHistoryResponseMeta(history, lines)
      }
    });
  } catch (e) {
    console.error('refreshLastOrderQty', e);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

const applyEmployeeStocks = async (req, res) => {
  try {
    const siteKey = parseSiteKey(req.body?.siteKey);
    const supplier = getSupplierFromReq(req);
    const entryIds = Array.isArray(req.body?.entryIds)
      ? req.body.entryIds.map((id) => String(id)).filter(Boolean)
      : [];
    if (!siteKey) return res.status(400).json({ success: false, error: 'siteKey requis' });
    if (!entryIds.length) {
      return res.status(400).json({ success: false, error: 'Sélectionnez au moins un import stocks salarié' });
    }

    const entries = await TgtStockEntry.find({ siteKey, supplier, _id: { $in: entryIds } })
      .sort({ createdAt: 1 })
      .lean();
    if (!entries.length) {
      return res.status(404).json({ success: false, error: 'Aucun import stocks salarié trouvé' });
    }

    const stockByProductId = buildEmployeeStockByProductReplace(entries);
    const deliveryDate = getCurrentDeliveryFriday();
    const weekKey = deliveryWeekKey(deliveryDate);

    let order = await SupplierOrder.findOne(orderQuery(siteKey, weekKey, supplier));
    let lines = order?.lines?.length
      ? (order.lines || []).map((l) => (typeof l.toObject === 'function' ? l.toObject() : { ...l }))
      : await buildLinesFromCatalog(siteKey, [], { supplier });

    // Import salarié = remplacement : on efface carton/unité puis on applique l'import.
    lines = lines.map((line) => {
      const pid = String(line.productId);
      const imported = stockByProductId.get(pid);
      return computeLineMetrics({
        ...line,
        cartonQty: imported ? imported.cartonQty : null,
        unitQty: imported ? imported.unitQty : null,
        stockQty: null
      });
    });

    const saved = await upsertCurrentOrder(siteKey, lines, { employeeStockEntryIds: entryIds }, supplier);
    const employeeStockImports = await buildEmployeeStockImportMeta(siteKey, entryIds);

    res.json({
      success: true,
      data: saved,
      meta: {
        importCount: entries.length,
        matchedProducts: stockByProductId.size,
        employeeStockImports
      }
    });
  } catch (e) {
    console.error('applyEmployeeStocks', e);
    res.status(500).json({ success: false, error: 'Erreur import stocks salariés' });
  }
};

const applyPositiveStock = async (req, res) => {
  try {
    const siteKey = parseSiteKey(req.body?.siteKey);
    const supplier = getSupplierFromReq(req);
    if (!siteKey) return res.status(400).json({ success: false, error: 'siteKey requis' });
    if (supplier !== SUPPLIER_TGT) {
      return res.status(400).json({ success: false, error: 'Stocks Positive : TGT uniquement' });
    }

    const [positiveMap, catalog, deliveryDate] = await Promise.all([
      getPositiveStockMap(),
      PositiveCatalog.getOrCreate(),
      Promise.resolve(getCurrentDeliveryFriday())
    ]);
    const weekKey = deliveryWeekKey(deliveryDate);

    let order = await SupplierOrder.findOne(orderQuery(siteKey, weekKey, supplier));
    if (!order) {
      const lines = await buildLinesFromCatalog(siteKey, [], { supplier });
      order = { lines };
    }

    const updated = (order.lines || []).map((line) => {
      const plain = typeof line.toObject === 'function' ? line.toObject() : { ...line };
      const matched = matchPositiveCount(plain.productName, positiveMap, catalog.products);
      if (matched == null) return plain;
      return { ...plain, cartonQty: matched, unitQty: null, stockQty: null };
    });
    const saved = await upsertCurrentOrder(siteKey, updated, {}, supplier);

    const scan = await PositiveScan.findOne().sort({ createdAt: -1 });

    res.json({
      success: true,
      data: saved,
      meta: {
        positiveScanAt: scan?.createdAt || null,
        positiveScanId: scan?._id || null,
        matchedCount: (saved.lines || []).filter((l) => hasAnyStockValue(l)).length
      }
    });
  } catch (e) {
    console.error('applyPositiveStock', e);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

const getRecap = async (req, res) => {
  try {
    const siteKey = parseSiteKey(req.query.siteKey);
    const supplier = getSupplierFromReq(req);
    if (!siteKey) return res.status(400).json({ success: false, error: 'siteKey requis' });

    const deliveryDate = getCurrentDeliveryFriday();
    const weekKey = deliveryWeekKey(deliveryDate);
    const order = await SupplierOrder.findOne(orderQuery(siteKey, weekKey, supplier));
    if (!order) return res.json({ success: true, data: [], meta: { deliveryDate, deliveryWeekKey: weekKey } });

    const recap = (order.lines || [])
      .filter((l) => Number(l.orderQty) > 0)
      .sort((a, b) => {
        const loc = (a.locationName || '').localeCompare(b.locationName || '', 'fr');
        if (loc !== 0) return loc;
        return (a.productName || '').localeCompare(b.productName || '', 'fr');
      });

    res.json({
      success: true,
      data: recap,
      meta: {
        deliveryDate: order.deliveryDate,
        deliveryWeekKey: order.deliveryWeekKey,
        status: order.status,
        totalLines: recap.length,
        totalQty: recap.reduce((s, l) => s + (Number(l.orderQty) || 0), 0)
      }
    });
  } catch (e) {
    console.error('getRecap', e);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

const seedArrasCatalog = async (req, res) => {
  try {
    const siteKey = parseSiteKey(req.body?.siteKey) || 'plan';
    if (siteKey !== 'plan') {
      return res.status(400).json({ success: false, error: 'Seed catalogue TGT PDF : site Arras (plan) uniquement' });
    }
    const seedPath = path.join(__dirname, '../data/tgt-arras-catalog-seed.json');
    if (!fs.existsSync(seedPath)) {
      return res.status(404).json({ success: false, error: 'Fichier seed absent. Lancez parse-tgt-pdfs.js' });
    }
    const seed = JSON.parse(fs.readFileSync(seedPath, 'utf8'));
    const products = seed.products || [];
    await ensureDefaultLocations(siteKey);
    const locations = await SupplierOrderLocation.find({ siteKey });
    const { locById, locByName } = buildLocationMaps(locations);

    let imported = 0;
    for (const [idx, row] of products.entries()) {
      const name = String(row.name || '').trim();
      if (!name) continue;
      const existing = await SupplierOrderProduct.findOne({
        siteKey,
        supplierCode: row.supplierCode || name
      }).select('locationId locationName');
      let locationId = null;
      let locationName = String(row.locationName || '').trim();
      if (existing?.locationId || existing?.locationName) {
        locationId = existing.locationId || null;
        locationName = String(existing.locationName || '').trim();
      } else if (locationName) {
        const resolved = resolvePlacementFromItem({ locationName }, locById, locByName);
        locationId = resolved.locationId;
        locationName = resolved.locationName;
      }
      await SupplierOrderProduct.updateOne(
        { siteKey, supplierCode: row.supplierCode || name },
        {
          $set: {
            siteKey,
            name,
            supplierCode: String(row.supplierCode || '').trim(),
            locationId,
            locationName,
            unit: row.unit || 'pièce',
            order: Number(row.order ?? idx),
            isActive: true
          }
        },
        { upsert: true, runValidators: true }
      );
      imported += 1;
    }

    const deliveryDate = getCurrentDeliveryFriday();
    const weekKey = deliveryWeekKey(deliveryDate);
    const lines = await buildLinesFromCatalog(siteKey, []);
    for (const line of lines) {
      const seedRow = products.find((p) => p.supplierCode === line.supplierCode);
      if (seedRow?.lastOrderQty != null) line.lastOrderQty = seedRow.lastOrderQty;
    }
    await upsertCurrentOrder(siteKey, lines, {}, SUPPLIER_TGT);

    res.json({
      success: true,
      imported,
      productCount: products.length,
      ordersInSeed: seed.orders || []
    });
  } catch (e) {
    console.error('seedArrasCatalog', e);
    res.status(500).json({ success: false, error: e.message || 'Erreur seed' });
  }
};

async function seedMillangeCatalogForSite(siteKey = 'plan') {
  if (siteKey !== 'plan') {
    throw new Error("Seed catalogue Mill'Ange : site Arras (plan) uniquement");
  }
  const supplier = SUPPLIER_MILLANGE;
  const seedPath = path.join(__dirname, '../data/millange-arras-catalog-seed.json');
  if (!fs.existsSync(seedPath)) {
    throw new Error("Fichier seed Mill'Ange absent");
  }
  const seed = JSON.parse(fs.readFileSync(seedPath, 'utf8'));
  const products = seed.products || [];
  await ensureDefaultLocations(siteKey, supplier);
  const locations = await SupplierOrderLocation.find(catalogQuery(siteKey, supplier));
  const { locById, locByName } = buildLocationMaps(locations);

  let imported = 0;
  for (const [idx, row] of products.entries()) {
    const name = String(row.name || '').trim();
    if (!name) continue;
    const locationName = String(row.locationName || 'Surgelé').trim();
    const resolved = resolvePlacementFromItem({ locationName }, locById, locByName);
    await SupplierOrderProduct.updateOne(
      { siteKey, supplier, supplierCode: row.supplierCode || name },
      {
        $set: {
          siteKey,
          supplier,
          name,
          supplierCode: String(row.supplierCode || '').trim(),
          locationId: resolved.locationId,
          locationName: resolved.locationName || locationName,
          unit: row.unit || 'Colis',
          order: Number(row.order ?? idx * 10),
          isActive: true
        }
      },
      { upsert: true, runValidators: true }
    );
    imported += 1;
  }

  const lines = await buildLinesFromCatalog(siteKey, [], { supplier });
  await upsertCurrentOrder(siteKey, lines, {}, supplier);
  return { imported, productCount: products.length };
}

const seedMillangeCatalog = async (req, res) => {
  try {
    const siteKey = parseSiteKey(req.body?.siteKey) || 'plan';
    const result = await seedMillangeCatalogForSite(siteKey);
    res.json({ success: true, ...result });
  } catch (e) {
    console.error('seedMillangeCatalog', e);
    res.status(500).json({ success: false, error: e.message || 'Erreur seed Mill\'Ange' });
  }
};

/** Retrouve un produit existant (évite E11000 siteKey+name lors d’un upsert). */
async function findSupplierProductForSave(siteKey, supplier, item) {
  const name = String(item?.name || '').trim();
  if (!name) return null;

  if (item._id && mongoose.Types.ObjectId.isValid(item._id)) {
    const byId = await SupplierOrderProduct.findOne({ _id: item._id, siteKey });
    if (byId) return byId;
  }

  const q = catalogQuery(siteKey, supplier);
  const code = String(item.supplierCode || '').trim();
  if (code) {
    const byCode = await SupplierOrderProduct.findOne({ ...q, supplierCode: code });
    if (byCode) return byCode;
  }

  const byName = await SupplierOrderProduct.findOne({ ...q, name });
  if (byName) return byName;

  const nNorm = normalizeName(name);
  if (nNorm) {
    const rows = await SupplierOrderProduct.find(q).select('name _id');
    const hit = rows.find((r) => normalizeName(r.name) === nNorm);
    if (hit) return hit;
  }

  return SupplierOrderProduct.findOne({ siteKey, name });
}

function buildSupplierProductImportLookup(catalogRows = []) {
  const byCode = new Map();
  const byNameNorm = new Map();
  for (const row of catalogRows) {
    const plain = row.toObject ? row.toObject() : row;
    const code = String(plain.supplierCode || '').trim();
    if (code) byCode.set(code, plain);
    const nNorm = normalizeName(plain.name);
    if (nNorm && !byNameNorm.has(nNorm)) byNameNorm.set(nNorm, plain);
  }
  return { byCode, byNameNorm };
}

function findExistingSupplierProductForImport(lookup, { supplierCode, name }) {
  const code = String(supplierCode || '').trim();
  if (code && lookup.byCode.has(code)) return lookup.byCode.get(code);
  const nNorm = normalizeName(name);
  if (!nNorm) return null;
  return lookup.byNameNorm.get(nNorm) || null;
}

async function upsertSupplierProductFromPdfImport(siteKey, supplier, p, idx, { locById, locByName, defaultLocName, lookup }) {
  const displayName = String(p.name || '')
    .trim()
    .replace(/\s+/g, ' ');
  if (!displayName) return;

  const supplierCode = String(p.supplierCode || '').trim();
  const existing = findExistingSupplierProductForImport(lookup, {
    supplierCode,
    name: displayName
  });

  let locationId = null;
  let locationName = String(p.locationName || defaultLocName || '').trim();
  if (existing?.locationId || existing?.locationName) {
    locationId = existing.locationId || null;
    locationName = String(existing.locationName || '').trim();
  } else if (locationName) {
    const resolved = resolvePlacementFromItem({ locationName }, locById, locByName);
    locationId = resolved.locationId;
    locationName = resolved.locationName;
  }
  const productOrder = existing?.order != null ? existing.order : idx * 10;

  const payload = {
    siteKey,
    supplier,
    name: displayName,
    supplierCode: supplierCode || String(existing?.supplierCode || '').trim(),
    locationId,
    locationName,
    unit: p.unit || 'pièce',
    order: productOrder,
    isActive: true
  };

  // Upsert par _id si trouvé, sinon par nom (index unique siteKey+name ou siteKey+supplier+name).
  const filter = existing ? { _id: existing._id } : { siteKey, supplier, name: displayName };
  await SupplierOrderProduct.updateOne(filter, { $set: payload }, { upsert: true, runValidators: true });
}

async function importDeliveryPdfForSite(siteKey, supplier, buffer, originalName = '') {
  const { meta, products } = await tgtPdfParser.parsePdfBuffer(buffer);
    await ensureDefaultLocations(siteKey, supplier);
    const locations = await SupplierOrderLocation.find(catalogQuery(siteKey, supplier));
    const { locById, locByName } = buildLocationMaps(locations);
    const defaultLocName = supplier === SUPPLIER_MILLANGE ? 'Surgelé' : '';
    const catalogRows = await SupplierOrderProduct.find(catalogQuery(siteKey, supplier)).select(
      '_id locationId locationName order name supplierCode'
    );
    const lookup = buildSupplierProductImportLookup(catalogRows);

    for (const [idx, p] of products.entries()) {
      await upsertSupplierProductFromPdfImport(siteKey, supplier, p, idx, {
        locById,
        locByName,
        defaultLocName,
        lookup
      });
    }

    if (meta.orderNumber) {
      await SupplierOrderDelivery.findOneAndUpdate(
        { siteKey, supplier, orderNumber: meta.orderNumber },
        {
          siteKey,
          supplier,
          orderNumber: meta.orderNumber,
          orderDate: meta.orderDate || '',
          receptionDate: meta.receptionDate || '',
          source: 'pdf',
          fileName: originalName || '',
          lines: products.map((p) => ({
            supplierCode: p.supplierCode,
            productName: p.name,
            unit: p.unit,
            orderedQty: p.orderedQty,
            deliveredQty: p.deliveredQty,
            receivedQty: p.receivedQty
          }))
        },
        { upsert: true }
      );
    }

    const deliveryDate = getCurrentDeliveryFriday();
    const weekKey = deliveryWeekKey(deliveryDate);
    let order = await SupplierOrder.findOne(orderQuery(siteKey, weekKey, supplier));
    const existingPlain = (order?.lines || []).map((l) => (l.toObject ? l.toObject() : { ...l }));

    let lines = await buildLinesFromCatalog(siteKey, existingPlain, { applyHistory: true, supplier });
    lines = mergeCatalogWithExistingOrder(lines, existingPlain);
    lines = lines.map((line) => {
      const hit = findPdfProductHit(line, products);
      if (!hit) return line;
      const qty = hit.receivedQty ?? hit.orderedQty ?? null;
      return computeLineMetrics({
        ...line,
        receivedQty: qty,
        lastOrderQty: qty
      });
    });

    const history = await buildOrderHistoryMaps(siteKey, supplier);
    lines = applyCmdColumnsFromHistory(lines, history, { overwrite: true });

    const saved = await upsertCurrentOrder(siteKey, lines, {}, supplier);
    return {
      data: saved,
      meta: {
        ...meta,
        parsedLines: products.length,
        matchedLines: lines.filter((l) => l.receivedQty != null).length,
        ...buildCmdHistoryResponseMeta(history, lines)
      }
    };
}

const importDeliveryPdf = async (req, res) => {
  try {
    const siteKey = parseSiteKey(req.body?.siteKey || req.query?.siteKey);
    const supplier = getSupplierFromReq(req);
    const file = req.file;
    if (!siteKey) return res.status(400).json({ success: false, error: 'siteKey requis' });
    if (!file?.buffer) return res.status(400).json({ success: false, error: 'PDF requis' });

    const result = await importDeliveryPdfForSite(
      siteKey,
      supplier,
      file.buffer,
      file.originalname || ''
    );
    res.json({ success: true, ...result });
  } catch (e) {
    console.error('importDeliveryPdf', e);
    const msg = String(e.message || '');
    const friendly =
      e.code === 11000 || msg.includes('E11000')
        ? 'Produit déjà présent dans le catalogue (doublon de nom). Réessayez après déploiement API ou contactez le support.'
        : msg || 'Erreur import PDF';
    res.status(500).json({ success: false, error: friendly });
  }
};

const applyReceivedFromLast = async (req, res) => {
  try {
    const siteKey = parseSiteKey(req.body?.siteKey);
    const supplier = getSupplierFromReq(req);
    if (!siteKey) return res.status(400).json({ success: false, error: 'siteKey requis' });

    const lastOrder = await SupplierOrder.findOne({
      siteKey,
      supplier,
      status: 'submitted'
    }).sort({ deliveryDate: -1, updatedAt: -1 });
    if (!lastOrder) {
      return res.status(404).json({ success: false, error: 'Aucune commande validée précédente' });
    }

    const deliveryDate = getCurrentDeliveryFriday();
    const weekKey = deliveryWeekKey(deliveryDate);
    let order = await SupplierOrder.findOne(orderQuery(siteKey, weekKey, supplier));
    let lines = order?.lines?.length
      ? order.lines.map((l) => (l.toObject ? l.toObject() : { ...l }))
      : await buildLinesFromCatalog(siteKey, [], { supplier });

    const byId = new Map();
    const byCode = new Map();
    const byName = new Map();
    for (const l of lastOrder.lines || []) {
      if (l.productId) byId.set(String(l.productId), l.orderQty ?? 0);
      if (l.supplierCode) byCode.set(l.supplierCode, l.orderQty ?? 0);
      if (l.productName) byName.set(normalizeName(l.productName), l.orderQty ?? 0);
    }

    lines = lines.map((line) => {
      const qty =
        byId.get(String(line.productId)) ??
        (line.supplierCode ? byCode.get(line.supplierCode) : null) ??
        byName.get(normalizeName(line.productName));
      if (qty == null) return computeLineMetrics(line);
      return computeLineMetrics({ ...line, receivedQty: qty });
    });

    const saved = await upsertCurrentOrder(siteKey, lines, {}, supplier);
    res.json({
      success: true,
      data: saved,
      meta: { fromOrder: lastOrder.deliveryWeekKey, filled: lines.filter((l) => l.receivedQty != null).length }
    });
  } catch (e) {
    console.error('applyReceivedFromLast', e);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

const computeForecast = async (req, res) => {
  try {
    const siteKey = parseSiteKey(req.body?.siteKey);
    const supplier = getSupplierFromReq(req);
    const apply = req.body?.apply === true || req.body?.apply === 'true';
    if (!siteKey) return res.status(400).json({ success: false, error: 'siteKey requis' });

    const deliveryDate = getCurrentDeliveryFriday();
    const weekKey = deliveryWeekKey(deliveryDate);
    const order = await SupplierOrder.findOne(orderQuery(siteKey, weekKey, supplier));
    if (!order) return res.status(404).json({ success: false, error: 'Aucune commande en cours' });

    let lines = await enrichLines(siteKey, order.lines || []);
    if (apply) {
      lines = lines.map((l) => {
        if (l.suggestedOrderQty != null && l.suggestedOrderQty > 0) {
          return { ...l, orderQty: l.suggestedOrderQty };
        }
        return l;
      });
    }

    const saved = await upsertCurrentOrder(siteKey, lines, {}, supplier);
    const outLines = saved.lines || lines;
    const rolling = await buildRollingConsumptionMap(siteKey, weekKey, ROLLING_WEEKS);

    res.json({
      success: true,
      data: saved,
      meta: {
        forecastLines: outLines.filter((l) => l.suggestedOrderQty != null && l.suggestedOrderQty > 0).length,
        avgFromHistoryLines: outLines.filter((l) => l.avgConsumptionQty != null).length,
        rollingWeeksUsed: rolling.historyWeeks,
        rollingWeeksTarget: ROLLING_WEEKS,
        applied: apply
      }
    });
  } catch (e) {
    console.error('computeForecast', e);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

module.exports = {
  getLocations,
  putLocations,
  getProducts,
  putProducts,
  importProducts,
  getCurrentOrder,
  saveCurrentOrder,
  submitCurrentOrder,
  refreshLastOrderQty,
  applyPositiveStock,
  applyEmployeeStocks,
  getRecap,
  seedArrasCatalog,
  seedMillangeCatalog,
  seedMillangeCatalogForSite,
  importDeliveryPdf,
  importDeliveryPdfForSite,
  applyReceivedFromLast,
  computeForecast
};
