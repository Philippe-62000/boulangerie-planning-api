const TgtStockConfig = require('../models/TgtStockConfig');
const TgtStockEntry = require('../models/TgtStockEntry');
const SupplierOrderProduct = require('../models/SupplierOrderProduct');
const SupplierOrderLocation = require('../models/SupplierOrderLocation');
const {
  normalizeSubmissionDays,
  isSubmissionUpToDate,
  formatDayLabels,
  getCurrentDueWindow,
  DAY_LABELS
} = require('../utils/tgtStockSchedule');

const normalizeSiteKey = (raw) => (raw === 'lon' ? 'lon' : 'plan');

const getConfig = async (req, res) => {
  try {
    const siteKey = normalizeSiteKey(req.query.siteKey);
    let cfg = await TgtStockConfig.findOne({ siteKey }).lean();
    if (!cfg) {
      cfg = { siteKey, submissionDays: [] };
    }
    res.json({
      success: true,
      data: {
        siteKey,
        submissionDays: normalizeSubmissionDays(cfg.submissionDays)
      },
      dayLabels: DAY_LABELS
    });
  } catch (e) {
    console.error('tgtStock getConfig', e);
    res.status(500).json({ success: false, error: 'Erreur chargement config stocks TGT' });
  }
};

const putConfig = async (req, res) => {
  try {
    const siteKey = normalizeSiteKey(req.body.siteKey || req.query.siteKey);
    const submissionDays = normalizeSubmissionDays(req.body.submissionDays);
    const cfg = await TgtStockConfig.findOneAndUpdate(
      { siteKey },
      { siteKey, submissionDays },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean();
    res.json({
      success: true,
      data: { siteKey, submissionDays: cfg.submissionDays }
    });
  } catch (e) {
    console.error('tgtStock putConfig', e);
    res.status(500).json({ success: false, error: 'Erreur enregistrement config stocks TGT' });
  }
};

const getProductsForEntry = async (req, res) => {
  try {
    const siteKey = normalizeSiteKey(req.query.siteKey);
    const [products, locations] = await Promise.all([
      SupplierOrderProduct.find({ siteKey, isActive: true }).sort({ order: 1, name: 1 }).lean(),
      SupplierOrderLocation.find({ siteKey, isActive: true }).sort({ order: 1, name: 1 }).lean()
    ]);
    const locById = new Map(locations.map((l) => [String(l._id), l.name]));
    const items = products.map((p) => ({
      productId: p._id,
      productName: p.name,
      locationName: p.locationName || locById.get(String(p.locationId)) || '',
      supplierCode: p.supplierCode || ''
    }));
    res.json({ success: true, data: items, locations: locations.map((l) => l.name) });
  } catch (e) {
    console.error('tgtStock getProductsForEntry', e);
    res.status(500).json({ success: false, error: 'Erreur chargement produits TGT' });
  }
};

const postEntry = async (req, res) => {
  try {
    const siteKey = normalizeSiteKey(req.body.siteKey);
    const employeeName = String(req.body.employeeName || req.employeeName || '').trim();
    const employeeId = req.body.employeeId || req.employeeId || null;
    const rawItems = Array.isArray(req.body.items) ? req.body.items : [];

    if (!employeeName) {
      return res.status(400).json({ success: false, error: 'Nom du salarié requis' });
    }

    const items = rawItems
      .map((it) => ({
        productId: it.productId,
        productName: String(it.productName || '').trim(),
        locationName: String(it.locationName || '').trim(),
        stockQty:
          it.stockQty === '' || it.stockQty == null ? null : Math.max(0, Number(it.stockQty) || 0)
      }))
      .filter((it) => it.productId && it.productName && it.stockQty != null);

    if (!items.length) {
      return res.status(400).json({ success: false, error: 'Saisissez au moins un stock produit' });
    }

    const entry = await TgtStockEntry.create({
      siteKey,
      employeeId: employeeId || null,
      employeeName,
      items,
      itemsCount: items.length
    });

    res.json({ success: true, data: entry, message: 'Saisie stocks TGT enregistrée.' });
  } catch (e) {
    console.error('tgtStock postEntry', e);
    res.status(500).json({ success: false, error: 'Erreur enregistrement saisie stocks TGT' });
  }
};

const getEntries = async (req, res) => {
  try {
    const siteKey = normalizeSiteKey(req.query.siteKey);
    const limit = Math.min(200, Math.max(1, Number(req.query.limit) || 50));
    const entries = await TgtStockEntry.find({ siteKey })
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('_id employeeName itemsCount createdAt updatedAt')
      .lean();
    res.json({ success: true, data: entries });
  } catch (e) {
    console.error('tgtStock getEntries', e);
    res.status(500).json({ success: false, error: 'Erreur chargement historique stocks TGT' });
  }
};

const getEntryById = async (req, res) => {
  try {
    const siteKey = normalizeSiteKey(req.query.siteKey);
    const entry = await TgtStockEntry.findOne({ _id: req.params.entryId, siteKey }).lean();
    if (!entry) {
      return res.status(404).json({ success: false, error: 'Saisie introuvable' });
    }
    res.json({ success: true, data: entry });
  } catch (e) {
    console.error('tgtStock getEntryById', e);
    res.status(500).json({ success: false, error: 'Erreur chargement saisie stocks TGT' });
  }
};

const getStatus = async (req, res) => {
  try {
    const siteKey = normalizeSiteKey(req.query.siteKey);
    const cfg = await TgtStockConfig.findOne({ siteKey }).lean();
    const submissionDays = normalizeSubmissionDays(cfg?.submissionDays);

    const lastEntry = await TgtStockEntry.findOne({ siteKey }).sort({ createdAt: -1 }).lean();
    const lastSubmissionAt = lastEntry?.createdAt || null;
    const check = isSubmissionUpToDate(lastSubmissionAt, submissionDays);
    const { dueAnchor, nextAnchor } = getCurrentDueWindow(new Date(), submissionDays);

    res.json({
      success: true,
      meta: {
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
    res.status(500).json({ success: false, error: 'Erreur statut stocks TGT' });
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
