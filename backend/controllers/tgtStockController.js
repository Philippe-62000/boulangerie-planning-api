const TgtStockConfig = require('../models/TgtStockConfig');
const TgtStockEntry = require('../models/TgtStockEntry');
const SupplierOrderProduct = require('../models/SupplierOrderProduct');
const SupplierOrderLocation = require('../models/SupplierOrderLocation');
const { parseSupplier, catalogQuery } = require('../utils/supplierChannel');
const {
  normalizeSubmissionDays,
  isSubmissionUpToDate,
  formatDayLabels,
  getCurrentDueWindow,
  DAY_LABELS
} = require('../utils/tgtStockSchedule');
const { hasAnyStockValue, normalizeStockFields } = require('../utils/stockQtyFields');

const normalizeSiteKey = (raw) => (raw === 'lon' ? 'lon' : 'plan');
const getSupplierFromReq = (req) => parseSupplier(req.query?.supplier || req.body?.supplier);

const stockConfigQuery = (siteKey, supplier) => ({ siteKey: normalizeSiteKey(siteKey), supplier: parseSupplier(supplier) });

const getConfig = async (req, res) => {
  try {
    const siteKey = normalizeSiteKey(req.query.siteKey);
    const supplier = getSupplierFromReq(req);
    let cfg = await TgtStockConfig.findOne(stockConfigQuery(siteKey, supplier)).lean();
    if (!cfg && parseSupplier(supplier) === 'TGT') {
      cfg = await TgtStockConfig.findOne({
        siteKey,
        $or: [{ supplier: { $exists: false } }, { supplier: null }, { supplier: '' }]
      }).lean();
    }
    if (!cfg) {
      cfg = { siteKey, supplier: parseSupplier(supplier), submissionDays: [] };
    }
    res.json({
      success: true,
      data: {
        siteKey,
        supplier,
        submissionDays: normalizeSubmissionDays(cfg.submissionDays)
      },
      dayLabels: DAY_LABELS
    });
  } catch (e) {
    console.error('tgtStock getConfig', e);
    res.status(500).json({ success: false, error: 'Erreur chargement config stocks' });
  }
};

const putConfig = async (req, res) => {
  try {
    const siteKey = normalizeSiteKey(req.body.siteKey || req.query.siteKey);
    const supplier = getSupplierFromReq(req);
    const submissionDays = normalizeSubmissionDays(req.body.submissionDays);
    const isTgt = parseSupplier(supplier) === parseSupplier('TGT');
    const query = isTgt
      ? {
          siteKey,
          $or: [{ supplier: 'TGT' }, { supplier: { $exists: false } }, { supplier: null }, { supplier: '' }]
        }
      : stockConfigQuery(siteKey, supplier);

    let cfg = await TgtStockConfig.findOneAndUpdate(
      query,
      {
        $set: { submissionDays, siteKey, supplier: parseSupplier(supplier) },
        $setOnInsert: { siteKey, supplier: parseSupplier(supplier) }
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean();
    if (!cfg) {
      return res.status(500).json({ success: false, error: 'Config stocks non enregistrée' });
    }
    res.json({
      success: true,
      data: { siteKey, supplier, submissionDays: cfg.submissionDays }
    });
  } catch (e) {
    console.error('tgtStock putConfig', e);
    res.status(500).json({ success: false, error: 'Erreur enregistrement config stocks' });
  }
};

const getProductsForEntry = async (req, res) => {
  try {
    const siteKey = normalizeSiteKey(req.query.siteKey);
    const supplier = getSupplierFromReq(req);
    const [products, locations] = await Promise.all([
      SupplierOrderProduct.find({ ...catalogQuery(siteKey, supplier) })
        .sort({ order: 1, name: 1 })
        .lean(),
      SupplierOrderLocation.find({ ...catalogQuery(siteKey, supplier), isActive: true })
        .sort({ order: 1, name: 1 })
        .lean()
    ]);
    const locById = new Map(locations.map((l) => [String(l._id), l.name]));
    const items = products.map((p) => ({
      productId: p._id,
      productName: p.name,
      locationId: p.locationId || null,
      locationName: p.locationName || locById.get(String(p.locationId)) || '',
      supplierCode: p.supplierCode || '',
      unit: p.unit || 'pièce',
      order: p.order ?? 0,
      isActive: p.isActive !== false
    }));
    res.json({ success: true, data: items, locations: locations.map((l) => l.name) });
  } catch (e) {
    console.error('tgtStock getProductsForEntry', e);
    res.status(500).json({ success: false, error: 'Erreur chargement produits' });
  }
};

const postEntry = async (req, res) => {
  try {
    const siteKey = normalizeSiteKey(req.body.siteKey);
    const supplier = getSupplierFromReq(req);
    const employeeName = String(req.body.employeeName || req.employeeName || '').trim();
    const employeeId = req.body.employeeId || req.employeeId || null;
    const comment = String(req.body.comment || '').trim().slice(0, 500);
    const rawItems = Array.isArray(req.body.items) ? req.body.items : [];

    if (!employeeName) {
      return res.status(400).json({ success: false, error: 'Nom du salarié requis' });
    }

    const items = rawItems
      .map((it) => {
        const { cartonQty, unitQty } = normalizeStockFields(it);
        return {
          productId: it.productId,
          productName: String(it.productName || '').trim(),
          supplierCode: String(it.supplierCode || '').trim(),
          locationName: String(it.locationName || '').trim(),
          cartonQty,
          unitQty,
          stockQty: null
        };
      })
      .filter((it) => it.productId && it.productName && hasAnyStockValue(it));

    if (!items.length) {
      return res.status(400).json({ success: false, error: 'Saisissez au moins un stock produit' });
    }

    const entry = await TgtStockEntry.create({
      siteKey,
      supplier,
      employeeId: employeeId || null,
      employeeName,
      comment,
      items,
      itemsCount: items.length
    });

    res.json({ success: true, data: entry, message: 'Saisie stocks enregistrée.' });
  } catch (e) {
    console.error('tgtStock postEntry', e);
    res.status(500).json({ success: false, error: 'Erreur enregistrement saisie stocks' });
  }
};

const getEntries = async (req, res) => {
  try {
    const siteKey = normalizeSiteKey(req.query.siteKey);
    const supplier = getSupplierFromReq(req);
    const limit = Math.min(200, Math.max(1, Number(req.query.limit) || 50));
    const entries = await TgtStockEntry.find({ siteKey, supplier })
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('_id employeeName itemsCount comment createdAt updatedAt')
      .lean();
    res.json({ success: true, data: entries });
  } catch (e) {
    console.error('tgtStock getEntries', e);
    res.status(500).json({ success: false, error: 'Erreur chargement historique stocks' });
  }
};

const getEntryById = async (req, res) => {
  try {
    const siteKey = normalizeSiteKey(req.query.siteKey);
    const supplier = getSupplierFromReq(req);
    const entry = await TgtStockEntry.findOne({ _id: req.params.entryId, siteKey, supplier }).lean();
    if (!entry) {
      return res.status(404).json({ success: false, error: 'Saisie introuvable' });
    }
    res.json({ success: true, data: entry });
  } catch (e) {
    console.error('tgtStock getEntryById', e);
    res.status(500).json({ success: false, error: 'Erreur chargement saisie stocks' });
  }
};

const getStatus = async (req, res) => {
  try {
    const siteKey = normalizeSiteKey(req.query.siteKey);
    const supplier = getSupplierFromReq(req);
    const cfg = await TgtStockConfig.findOne(stockConfigQuery(siteKey, supplier)).lean();
    const submissionDays = normalizeSubmissionDays(cfg?.submissionDays);

    const lastEntry = await TgtStockEntry.findOne({ siteKey, supplier }).sort({ createdAt: -1 }).lean();
    const lastSubmissionAt = lastEntry?.createdAt || null;
    const check = isSubmissionUpToDate(lastSubmissionAt, submissionDays);
    const { dueAnchor, nextAnchor } = getCurrentDueWindow(new Date(), submissionDays);

    res.json({
      success: true,
      meta: {
        supplier,
        lastSubmissionAt,
        lastEmployeeName: lastEntry?.employeeName || '',
        lastEntryId: lastEntry?._id || null,
        itemsCount: lastEntry?.itemsCount ?? 0,
        submissionDays,
        submissionDaysLabel: formatDayLabels(submissionDays),
        upToDate: check.upToDate,
        dueAnchor,
        nextAnchor,
        status: check.upToDate ? 'green' : 'red'
      }
    });
  } catch (e) {
    console.error('tgtStock getStatus', e);
    res.status(500).json({ success: false, error: 'Erreur statut stocks' });
  }
};

module.exports = {
  getConfig,
  putConfig,
  getProductsForEntry,
  postEntry,
  getEntries,
  getEntryById,
  getStatus
};
