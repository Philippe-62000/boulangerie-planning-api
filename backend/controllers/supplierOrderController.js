const fs = require('fs');
const path = require('path');
const SupplierOrderLocation = require('../models/SupplierOrderLocation');
const SupplierOrderProduct = require('../models/SupplierOrderProduct');
const SupplierOrder = require('../models/SupplierOrder');
const SupplierOrderDelivery = require('../models/SupplierOrderDelivery');
const PositiveScan = require('../models/PositiveScan');
const PositiveCatalog = require('../models/PositiveCatalog');
const tgtPdfParser = require('../services/tgtPdfParser');

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

async function ensureDefaultLocations(siteKey) {
  const count = await SupplierOrderLocation.countDocuments({ siteKey });
  if (count > 0) return;
  const docs = DEFAULT_LOCATIONS.map((name, idx) => ({
    siteKey,
    name,
    order: idx,
    isActive: true
  }));
  await SupplierOrderLocation.insertMany(docs, { ordered: false });
}

async function getLastSubmittedOrder(siteKey) {
  return SupplierOrder.findOne({ siteKey, status: 'submitted' }).sort({ deliveryDate: -1, updatedAt: -1 });
}

function numOrNull(v) {
  if (v === '' || v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? Math.max(0, n) : null;
}

const ROLLING_WEEKS = 3;

/** Consommation = reçu − stock ; prévision = moyenne glissante 3 sem. si dispo, sinon conso semaine. */
function computeLineMetrics(line, avgConsumptionQty = null) {
  const receivedQty = numOrNull(line.receivedQty);
  const stockQty = numOrNull(line.stockQty);
  let consumptionQty = numOrNull(line.consumptionQty);
  const avg =
    avgConsumptionQty != null
      ? avgConsumptionQty
      : numOrNull(line.avgConsumptionQty);

  if (receivedQty != null && stockQty != null) {
    consumptionQty = Math.max(0, receivedQty - stockQty);
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
    stockQty,
    consumptionQty,
    avgConsumptionQty: avg != null ? Math.round(avg * 100) / 100 : null,
    suggestedOrderQty,
    lastOrderQty: line.lastOrderQty == null ? null : Number(line.lastOrderQty) || 0,
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
        const received = numOrNull(line.receivedQty);
        const stock = numOrNull(line.stockQty);
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
    stockQty: l.stockQty,
    consumptionQty: l.consumptionQty,
    suggestedOrderQty: l.suggestedOrderQty,
    lastOrderQty: l.lastOrderQty,
    orderQty: l.orderQty
  }, avgConsumptionQty);
}

async function upsertCurrentOrder(siteKey, lines, extra = {}) {
  const deliveryDate = getCurrentDeliveryFriday();
  const weekKey = deliveryWeekKey(deliveryDate);
  const enriched = await enrichLines(siteKey, lines);
  return SupplierOrder.findOneAndUpdate(
    { siteKey, deliveryWeekKey: weekKey, supplier: 'TGT' },
    {
      siteKey,
      supplier: 'TGT',
      deliveryWeekKey: weekKey,
      deliveryDate,
      status: 'draft',
      lines: enriched,
      ...extra
    },
    { upsert: true, new: true }
  );
}

async function buildLinesFromCatalog(siteKey, existingLines = []) {
  const [products, locations, lastOrder] = await Promise.all([
    SupplierOrderProduct.find({ siteKey, isActive: true }).sort({ order: 1, name: 1 }),
    SupplierOrderLocation.find({ siteKey, isActive: true }).sort({ order: 1, name: 1 }),
    getLastSubmittedOrder(siteKey)
  ]);

  const locById = new Map(locations.map((l) => [String(l._id), l]));
  const lastByProductId = new Map();
  const lastByName = new Map();
  const lastByCode = new Map();
  const receivedFromLastByProductId = new Map();
  const receivedFromLastByCode = new Map();
  const receivedFromLastByName = new Map();
  if (lastOrder?.lines?.length) {
    for (const line of lastOrder.lines) {
      const qty = line.orderQty ?? 0;
      if (line.productId) {
        lastByProductId.set(String(line.productId), qty);
        receivedFromLastByProductId.set(String(line.productId), qty);
      }
      if (line.productName) {
        lastByName.set(normalizeName(line.productName), qty);
        receivedFromLastByName.set(normalizeName(line.productName), qty);
      }
      if (line.supplierCode) {
        lastByCode.set(String(line.supplierCode), qty);
        receivedFromLastByCode.set(String(line.supplierCode), qty);
      }
    }
  }

  const existingByProductId = new Map(
    (existingLines || []).map((l) => [String(l.productId), l])
  );

  return products.map((p) => {
    const prev = existingByProductId.get(String(p._id));
    const loc = p.locationId ? locById.get(String(p.locationId)) : null;
    const lastQty =
      lastByProductId.get(String(p._id)) ??
      lastByName.get(normalizeName(p.name)) ??
      null;

    const code = p.supplierCode || '';
    const receivedDefault =
      receivedFromLastByProductId.get(String(p._id)) ??
      (code ? receivedFromLastByCode.get(code) : null) ??
      receivedFromLastByName.get(normalizeName(p.name)) ??
      null;

    return computeLineMetrics({
      productId: p._id,
      productName: p.name,
      supplierCode: code,
      locationId: p.locationId || null,
      locationName: loc?.name || '',
      receivedQty: prev?.receivedQty ?? receivedDefault,
      stockQty: prev?.stockQty ?? null,
      lastOrderQty: lastQty,
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
    if (!siteKey) return res.status(400).json({ success: false, error: 'siteKey requis (lon|plan)' });
    await ensureDefaultLocations(siteKey);
    const locations = await SupplierOrderLocation.find({ siteKey }).sort({ order: 1, name: 1 });
    res.json({ success: true, data: locations });
  } catch (e) {
    console.error('getLocations', e);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

const putLocations = async (req, res) => {
  try {
    const siteKey = parseSiteKey(req.body?.siteKey);
    const items = req.body?.items;
    if (!siteKey) return res.status(400).json({ success: false, error: 'siteKey requis' });
    if (!Array.isArray(items)) return res.status(400).json({ success: false, error: 'items requis' });

    for (const [idx, item] of items.entries()) {
      const name = String(item.name || '').trim();
      if (!name) continue;
      const payload = {
        siteKey,
        name,
        order: Number(item.order ?? idx),
        isActive: item.isActive !== false
      };
      if (item._id) {
        await SupplierOrderLocation.findOneAndUpdate({ _id: item._id, siteKey }, payload);
      } else {
        await SupplierOrderLocation.findOneAndUpdate({ siteKey, name }, payload, { upsert: true });
      }
    }

    const locations = await SupplierOrderLocation.find({ siteKey }).sort({ order: 1, name: 1 });
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
    if (!siteKey) return res.status(400).json({ success: false, error: 'siteKey requis' });
    await ensureDefaultLocations(siteKey);
    const products = await SupplierOrderProduct.find({ siteKey })
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
    const items = req.body?.items;
    if (!siteKey) return res.status(400).json({ success: false, error: 'siteKey requis' });
    if (!Array.isArray(items)) return res.status(400).json({ success: false, error: 'items requis' });

    for (const [idx, item] of items.entries()) {
      const name = String(item.name || '').trim();
      if (!name) continue;
      const payload = {
        siteKey,
        name,
        supplierCode: String(item.supplierCode || '').trim(),
        locationId: item.locationId || null,
        unit: String(item.unit || 'pièce').trim(),
        targetStock: item.targetStock != null && item.targetStock !== '' ? Number(item.targetStock) : null,
        order: Number(item.order ?? idx),
        isActive: item.isActive !== false
      };
      if (item._id) {
        await SupplierOrderProduct.findOneAndUpdate({ _id: item._id, siteKey }, payload);
      } else {
        await SupplierOrderProduct.findOneAndUpdate({ siteKey, name }, payload, { upsert: true });
      }
    }

    const products = await SupplierOrderProduct.find({ siteKey })
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

    await ensureDefaultLocations(siteKey);
    const locations = await SupplierOrderLocation.find({ siteKey });
    const locByName = new Map(locations.map((l) => [normalizeName(l.name), l._id]));

    let imported = 0;
    for (const [idx, row] of rows.entries()) {
      const name = String(row.name || row.productName || '').trim();
      if (!name) continue;
      let locationId = row.locationId || null;
      if (!locationId && row.locationName) {
        locationId = locByName.get(normalizeName(row.locationName)) || null;
      }
      await SupplierOrderProduct.findOneAndUpdate(
        { siteKey, name },
        {
          siteKey,
          name,
          supplierCode: String(row.supplierCode || row.code || '').trim(),
          locationId,
          order: Number(row.order ?? idx),
          isActive: row.isActive !== false
        },
        { upsert: true, new: true }
      );
      imported += 1;
    }

    const products = await SupplierOrderProduct.find({ siteKey }).sort({ order: 1, name: 1 });
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
    if (!siteKey) return res.status(400).json({ success: false, error: 'siteKey requis' });

    await ensureDefaultLocations(siteKey);
    const deliveryDate = getCurrentDeliveryFriday();
    const weekKey = deliveryWeekKey(deliveryDate);

    let order = await SupplierOrder.findOne({ siteKey, deliveryWeekKey: weekKey, supplier: 'TGT' });
    if (!order) {
      const lines = await enrichLines(siteKey, await buildLinesFromCatalog(siteKey, []));
      order = await SupplierOrder.create({
        siteKey,
        supplier: 'TGT',
        deliveryWeekKey: weekKey,
        deliveryDate,
        status: 'draft',
        lines
      });
    } else {
      const merged = await buildLinesFromCatalog(siteKey, order.lines);
      const changed =
        merged.length !== (order.lines?.length || 0) ||
        merged.some((l, i) => String(l.productId) !== String(order.lines[i]?.productId));
      let base = order.lines;
      if (!order.lines?.length || changed) {
        base = merged;
        order.lines = merged;
        await order.save();
      }
      order.lines = await enrichLines(siteKey, base);
    }

    const lastSubmitted = await getLastSubmittedOrder(siteKey);
    const lastDelivery = await SupplierOrderDelivery.findOne({ siteKey })
      .sort({ createdAt: -1 })
      .select('orderNumber orderDate receptionDate fileName createdAt');
    const rolling = await buildRollingConsumptionMap(siteKey, weekKey, ROLLING_WEEKS);

    res.json({
      success: true,
      data: order,
      meta: {
        deliveryDate: order.deliveryDate,
        deliveryWeekKey: order.deliveryWeekKey,
        lastSubmittedAt: lastSubmitted?.updatedAt || null,
        lastSubmittedDelivery: lastSubmitted?.deliveryDate || null,
        lastDeliveryBl: lastDelivery || null,
        rollingWeeksUsed: rolling.historyWeeks,
        rollingWeeksTarget: ROLLING_WEEKS
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
      { siteKey, deliveryWeekKey: weekKey, supplier: 'TGT' },
      {
        siteKey,
        supplier: 'TGT',
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
    const submittedByName = String(req.body?.submittedByName || req.user?.name || '').trim();
    if (!siteKey) return res.status(400).json({ success: false, error: 'siteKey requis' });

    const deliveryDate = getCurrentDeliveryFriday();
    const weekKey = deliveryWeekKey(deliveryDate);

    const order = await SupplierOrder.findOne({ siteKey, deliveryWeekKey: weekKey, supplier: 'TGT' });
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
    if (!siteKey) return res.status(400).json({ success: false, error: 'siteKey requis' });

    const deliveryDate = getCurrentDeliveryFriday();
    const weekKey = deliveryWeekKey(deliveryDate);
    let order = await SupplierOrder.findOne({ siteKey, deliveryWeekKey: weekKey, supplier: 'TGT' });
    const existing = order?.lines || [];
    const built = await buildLinesFromCatalog(siteKey, existing);
    const lines = await enrichLines(siteKey, built);
    if (order) {
      order.lines = lines;
      await order.save();
    } else {
      order = await SupplierOrder.create({
        siteKey,
        supplier: 'TGT',
        deliveryWeekKey: weekKey,
        deliveryDate,
        status: 'draft',
        lines
      });
    }
    res.json({ success: true, data: order });
  } catch (e) {
    console.error('refreshLastOrderQty', e);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

const applyPositiveStock = async (req, res) => {
  try {
    const siteKey = parseSiteKey(req.body?.siteKey);
    if (!siteKey) return res.status(400).json({ success: false, error: 'siteKey requis' });

    const [positiveMap, catalog, deliveryDate] = await Promise.all([
      getPositiveStockMap(),
      PositiveCatalog.getOrCreate(),
      Promise.resolve(getCurrentDeliveryFriday())
    ]);
    const weekKey = deliveryWeekKey(deliveryDate);

    let order = await SupplierOrder.findOne({ siteKey, deliveryWeekKey: weekKey, supplier: 'TGT' });
    if (!order) {
      const lines = await buildLinesFromCatalog(siteKey, []);
      order = { lines };
    }

    const updated = (order.lines || []).map((line) => {
      const plain = typeof line.toObject === 'function' ? line.toObject() : { ...line };
      const matched = matchPositiveCount(plain.productName, positiveMap, catalog.products);
      if (matched == null) return plain;
      return { ...plain, stockQty: matched };
    });
    const saved = await upsertCurrentOrder(siteKey, updated);

    const scan = await PositiveScan.findOne().sort({ createdAt: -1 });

    res.json({
      success: true,
      data: saved,
      meta: {
        positiveScanAt: scan?.createdAt || null,
        positiveScanId: scan?._id || null,
        matchedCount: (saved.lines || []).filter((l) => l.stockQty != null).length
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
    if (!siteKey) return res.status(400).json({ success: false, error: 'siteKey requis' });

    const deliveryDate = getCurrentDeliveryFriday();
    const weekKey = deliveryWeekKey(deliveryDate);
    const order = await SupplierOrder.findOne({ siteKey, deliveryWeekKey: weekKey, supplier: 'TGT' });
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
    const locByName = new Map(locations.map((l) => [normalizeName(l.name), l._id]));

    let imported = 0;
    for (const [idx, row] of products.entries()) {
      const name = String(row.name || '').trim();
      if (!name) continue;
      let locationId = null;
      if (row.locationName) locationId = locByName.get(normalizeName(row.locationName)) || null;
      await SupplierOrderProduct.findOneAndUpdate(
        { siteKey, supplierCode: row.supplierCode || name },
        {
          siteKey,
          name,
          supplierCode: String(row.supplierCode || '').trim(),
          locationId,
          unit: row.unit || 'pièce',
          order: Number(row.order ?? idx),
          isActive: true
        },
        { upsert: true }
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
    await upsertCurrentOrder(siteKey, lines);

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

const importDeliveryPdf = async (req, res) => {
  try {
    const siteKey = parseSiteKey(req.body?.siteKey || req.query?.siteKey);
    const file = req.file;
    if (!siteKey) return res.status(400).json({ success: false, error: 'siteKey requis' });
    if (!file?.buffer) return res.status(400).json({ success: false, error: 'PDF requis' });

    const { meta, products } = await tgtPdfParser.parsePdfBuffer(file.buffer);
    await ensureDefaultLocations(siteKey);
    const locations = await SupplierOrderLocation.find({ siteKey });
    const locByName = new Map(locations.map((l) => [normalizeName(l.name), l._id]));

    for (const [idx, p] of products.entries()) {
      let locationId = locByName.get(normalizeName(p.locationName)) || null;
      await SupplierOrderProduct.findOneAndUpdate(
        { siteKey, supplierCode: p.supplierCode },
        {
          siteKey,
          name: p.name,
          supplierCode: p.supplierCode,
          locationId,
          unit: p.unit || 'pièce',
          order: idx,
          isActive: true
        },
        { upsert: true }
      );
    }

    if (meta.orderNumber) {
      await SupplierOrderDelivery.findOneAndUpdate(
        { siteKey, orderNumber: meta.orderNumber },
        {
          siteKey,
          supplier: 'TGT',
          orderNumber: meta.orderNumber,
          orderDate: meta.orderDate || '',
          receptionDate: meta.receptionDate || '',
          source: 'pdf',
          fileName: file.originalname || '',
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
    let order = await SupplierOrder.findOne({ siteKey, deliveryWeekKey: weekKey, supplier: 'TGT' });
    let lines = order?.lines?.length ? order.lines.map((l) => (l.toObject ? l.toObject() : { ...l })) : await buildLinesFromCatalog(siteKey, []);

    const byCode = new Map(products.map((p) => [p.supplierCode, p]));
    const byName = new Map(products.map((p) => [normalizeName(p.name), p]));

    lines = lines.map((line) => {
      const hit =
        (line.supplierCode && byCode.get(line.supplierCode)) ||
        byName.get(normalizeName(line.productName));
      if (!hit) return computeLineMetrics(line);
      return computeLineMetrics({
        ...line,
        receivedQty: hit.receivedQty,
        lastOrderQty: hit.orderedQty
      });
    });

    const saved = await upsertCurrentOrder(siteKey, lines);

    res.json({
      success: true,
      data: saved,
      meta: {
        ...meta,
        parsedLines: products.length,
        matchedLines: lines.filter((l) => l.receivedQty != null).length
      }
    });
  } catch (e) {
    console.error('importDeliveryPdf', e);
    res.status(500).json({ success: false, error: e.message || 'Erreur import PDF' });
  }
};

const applyReceivedFromLast = async (req, res) => {
  try {
    const siteKey = parseSiteKey(req.body?.siteKey);
    if (!siteKey) return res.status(400).json({ success: false, error: 'siteKey requis' });

    const lastOrder = await getLastSubmittedOrder(siteKey);
    if (!lastOrder) {
      return res.status(404).json({ success: false, error: 'Aucune commande validée précédente' });
    }

    const deliveryDate = getCurrentDeliveryFriday();
    const weekKey = deliveryWeekKey(deliveryDate);
    let order = await SupplierOrder.findOne({ siteKey, deliveryWeekKey: weekKey, supplier: 'TGT' });
    let lines = order?.lines?.length
      ? order.lines.map((l) => (l.toObject ? l.toObject() : { ...l }))
      : await buildLinesFromCatalog(siteKey, []);

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

    const saved = await upsertCurrentOrder(siteKey, lines);
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
    const apply = req.body?.apply === true || req.body?.apply === 'true';
    if (!siteKey) return res.status(400).json({ success: false, error: 'siteKey requis' });

    const deliveryDate = getCurrentDeliveryFriday();
    const weekKey = deliveryWeekKey(deliveryDate);
    const order = await SupplierOrder.findOne({ siteKey, deliveryWeekKey: weekKey, supplier: 'TGT' });
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

    const saved = await upsertCurrentOrder(siteKey, lines);
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
  getRecap,
  seedArrasCatalog,
  importDeliveryPdf,
  applyReceivedFromLast,
  computeForecast
};
