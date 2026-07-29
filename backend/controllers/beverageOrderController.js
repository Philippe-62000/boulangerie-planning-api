const multer = require('multer');
const pdfParse = require('pdf-parse');
const BeverageOrderProposal = require('../models/BeverageOrderProposal');
const BeveragePackConfig = require('../models/BeveragePackConfig');
const { parseCrisalidInvendusText } = require('../utils/parseCrisalidInvendusPdf');
const {
  enrichOrderFields,
  compareSalesPeriods,
  normalizePackSize
} = require('../utils/beverageOrderMath');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ok =
      file.mimetype === 'application/pdf' ||
      (file.originalname || '').toLowerCase().endsWith('.pdf');
    cb(ok ? null : new Error('Fichier PDF requis'), ok);
  }
});

function normalizeSiteKey(raw) {
  const s = String(raw || '').toLowerCase();
  if (s === 'lon' || s === 'longuenesse') return 'lon';
  return 'plan';
}

function extractPeriodHint(text) {
  const m = String(text).match(/Périodes?\s*\n?([0-9,\s]+)/i);
  if (m) return String(m[1]).replace(/\s+/g, '').slice(0, 120);
  const d = String(text).match(/Edité le\s+(\d{2}\/\d{2}\/\d{4})/i);
  return d ? `Édité le ${d[1]}` : '';
}

async function loadPackMap(siteKey) {
  const rows = await BeveragePackConfig.find({ siteKey }).lean();
  const map = new Map();
  for (const r of rows) {
    map.set(String(r.name).trim().toUpperCase(), normalizePackSize(r.packSize));
  }
  return map;
}

async function upsertPackSizes(siteKey, products) {
  const ops = [];
  const seen = new Set();
  for (const p of products || []) {
    const name = String(p.name || '').trim();
    if (!name) continue;
    const key = name.toUpperCase();
    if (seen.has(key)) continue;
    seen.add(key);
    const packSize = normalizePackSize(p.packSize);
    ops.push({
      updateOne: {
        filter: { siteKey, name },
        update: { $set: { packSize } },
        upsert: true
      }
    });
  }
  if (ops.length) await BeveragePackConfig.bulkWrite(ops, { ordered: false });
}

function mergeWithPrevious(parsedProducts, previousProducts, packMap, marginPercent) {
  const prevByName = new Map();
  for (const p of previousProducts || []) {
    if (!p?.name) continue;
    prevByName.set(String(p.name).trim().toUpperCase(), p);
  }

  return parsedProducts.map((p) => {
    const key = String(p.name).trim().toUpperCase();
    const prev = prevByName.get(key);
    const packSize =
      (prev && prev.packSize) ||
      packMap.get(key) ||
      normalizePackSize(p.packSize, 12);
    return enrichOrderFields(
      {
        ...p,
        stockQty: prev ? Number(prev.stockQty) || 0 : 0,
        packSize,
        previousConsumedQty: prev ? Number(prev.consumedQty) || 0 : null,
        marginPercent: prev?.marginPercent != null ? prev.marginPercent : marginPercent
      },
      marginPercent,
      packSize
    );
  });
}

const uploadMiddleware = upload.single('file');

/** GET /api/beverage-orders/current — dernières ventes en mémoire */
const getCurrent = async (req, res) => {
  try {
    const siteKey = normalizeSiteKey(req.query?.siteKey);
    let doc = await BeverageOrderProposal.findOne({ siteKey, isCurrent: true })
      .sort({ updatedAt: -1 })
      .lean();
    if (!doc) {
      doc = await BeverageOrderProposal.findOne({ siteKey }).sort({ createdAt: -1 }).lean();
    }
    res.json({ success: true, data: doc || null });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

/** GET /api/beverage-orders/pack-config */
const getPackConfig = async (req, res) => {
  try {
    const siteKey = normalizeSiteKey(req.query?.siteKey);
    const rows = await BeveragePackConfig.find({ siteKey }).sort({ name: 1 }).lean();
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

/** PUT /api/beverage-orders/pack-config — [{ name, packSize }] */
const savePackConfig = async (req, res) => {
  try {
    const siteKey = normalizeSiteKey(req.body?.siteKey || req.query?.siteKey);
    const items = Array.isArray(req.body?.items) ? req.body.items : [];
    await upsertPackSizes(
      siteKey,
      items.map((i) => ({ name: i.name, packSize: i.packSize }))
    );
    const rows = await BeveragePackConfig.find({ siteKey }).sort({ name: 1 }).lean();
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

/** POST /api/beverage-orders/parse */
const parsePdf = async (req, res) => {
  try {
    if (!req.file?.buffer) {
      return res.status(400).json({ success: false, error: 'Fichier PDF manquant' });
    }
    const siteKey = normalizeSiteKey(req.body?.siteKey || req.query?.siteKey);
    const parsed = await pdfParse(req.file.buffer);
    const { categories } = parseCrisalidInvendusText(parsed.text || '');
    if (!categories.length) {
      return res.status(400).json({
        success: false,
        error:
          'Aucune famille boissons/emballages trouvée dans le PDF. Vérifiez qu’il s’agit bien d’une synthèse Crisalid invendus/ventes.'
      });
    }

    const marginPercent = Math.max(0, Number(req.body?.marginPercent) || 10);
    const packMap = await loadPackMap(siteKey);

    let previousDoc = null;
    try {
      if (req.body?.previousProposalId) {
        previousDoc = await BeverageOrderProposal.findOne({
          _id: req.body.previousProposalId,
          siteKey
        }).lean();
      }
    } catch {
      previousDoc = null;
    }
    if (!previousDoc) {
      previousDoc = await BeverageOrderProposal.findOne({ siteKey, isCurrent: true })
        .sort({ updatedAt: -1 })
        .lean();
    }

    const rawProducts = [];
    for (const cat of categories) {
      for (const p of cat.products) {
        rawProducts.push({
          category: cat.name,
          name: p.name,
          ventesQty: p.ventesQty,
          offertsQty: p.offertsQty,
          consumedQty: p.consumedQty
        });
      }
    }

    const products = mergeWithPrevious(
      rawProducts,
      previousDoc?.products || [],
      packMap,
      marginPercent
    );

    const comparison = compareSalesPeriods(previousDoc?.products || [], products);

    res.json({
      success: true,
      data: {
        sourceFileName: req.file.originalname || '',
        periodHint: extractPeriodHint(parsed.text || ''),
        marginPercent,
        categories: categories.map((c) => ({
          name: c.name,
          code: c.code,
          productCount: c.products.length
        })),
        products,
        comparison,
        previous: previousDoc
          ? {
              id: String(previousDoc._id),
              periodLabel: previousDoc.periodLabel || '',
              sourceFileName: previousDoc.sourceFileName || '',
              updatedAt: previousDoc.updatedAt
            }
          : null,
        note: 'Commande le jeudi pour livraison le mardi — colis arrondis au-dessus'
      }
    });
  } catch (err) {
    console.error('❌ beverageOrders.parsePdf:', err);
    res.status(500).json({
      success: false,
      error: err.message || 'Erreur lors de l’analyse du PDF'
    });
  }
};

/** POST /api/beverage-orders/compare — compare deux propositions déjà enregistrées */
const compareProposals = async (req, res) => {
  try {
    const siteKey = normalizeSiteKey(req.body?.siteKey || req.query?.siteKey);
    const currentId = req.body?.currentId;
    const previousId = req.body?.previousId;
    if (!currentId || !previousId) {
      return res.status(400).json({ success: false, error: 'currentId et previousId requis' });
    }
    const [current, previous] = await Promise.all([
      BeverageOrderProposal.findOne({ _id: currentId, siteKey }).lean(),
      BeverageOrderProposal.findOne({ _id: previousId, siteKey }).lean()
    ]);
    if (!current || !previous) {
      return res.status(404).json({ success: false, error: 'Proposition introuvable' });
    }
    const comparison = compareSalesPeriods(previous.products || [], current.products || []);
    res.json({
      success: true,
      data: {
        comparison,
        current: { id: current._id, periodLabel: current.periodLabel, sourceFileName: current.sourceFileName },
        previous: { id: previous._id, periodLabel: previous.periodLabel, sourceFileName: previous.sourceFileName }
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

/** POST /api/beverage-orders — enregistre et marque comme ventes courantes */
const saveProposal = async (req, res) => {
  try {
    const siteKey = normalizeSiteKey(req.body?.siteKey || req.query?.siteKey);
    const marginPercent = Math.max(0, Number(req.body?.marginPercent) || 10);
    const productsIn = Array.isArray(req.body?.products) ? req.body.products : [];
    if (!productsIn.length) {
      return res.status(400).json({ success: false, error: 'Aucun produit à enregistrer' });
    }

    const products = productsIn
      .map((p) =>
        enrichOrderFields(
          {
            category: String(p.category || '').trim() || 'Divers',
            name: String(p.name || '').trim(),
            ventesQty: Math.max(0, Number(p.ventesQty) || 0),
            offertsQty: Math.max(0, Number(p.offertsQty) || 0),
            consumedQty: p.consumedQty,
            previousConsumedQty:
              p.previousConsumedQty != null ? Number(p.previousConsumedQty) : null,
            stockQty: p.stockQty,
            marginPercent: p.marginPercent,
            packSize: p.packSize
          },
          marginPercent
        )
      )
      .filter((p) => p.name);

    await upsertPackSizes(siteKey, products);
    await BeverageOrderProposal.updateMany({ siteKey, isCurrent: true }, { $set: { isCurrent: false } });

    const doc = await BeverageOrderProposal.create({
      siteKey,
      periodLabel: String(req.body?.periodLabel || '').trim(),
      sourceFileName: String(req.body?.sourceFileName || '').trim(),
      marginPercent,
      note: String(req.body?.note || 'Commande le jeudi pour livraison le mardi').trim(),
      previousPeriodLabel: String(req.body?.previousPeriodLabel || '').trim(),
      previousSourceFileName: String(req.body?.previousSourceFileName || '').trim(),
      products,
      isCurrent: true
    });

    res.json({ success: true, data: doc });
  } catch (err) {
    console.error('❌ beverageOrders.saveProposal:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

const listProposals = async (req, res) => {
  try {
    const siteKey = normalizeSiteKey(req.query?.siteKey);
    const limit = Math.min(50, Math.max(1, parseInt(req.query?.limit, 10) || 20));
    const rows = await BeverageOrderProposal.find({ siteKey })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

const getProposal = async (req, res) => {
  try {
    const siteKey = normalizeSiteKey(req.query?.siteKey);
    const doc = await BeverageOrderProposal.findOne({
      _id: req.params.id,
      siteKey
    }).lean();
    if (!doc) return res.status(404).json({ success: false, error: 'Proposition introuvable' });
    res.json({ success: true, data: doc });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

const deleteProposal = async (req, res) => {
  try {
    const siteKey = normalizeSiteKey(req.query?.siteKey || req.body?.siteKey);
    const result = await BeverageOrderProposal.deleteOne({ _id: req.params.id, siteKey });
    if (!result.deletedCount) {
      return res.status(404).json({ success: false, error: 'Proposition introuvable' });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

module.exports = {
  uploadMiddleware,
  parsePdf,
  saveProposal,
  listProposals,
  getProposal,
  deleteProposal,
  getCurrent,
  getPackConfig,
  savePackConfig,
  compareProposals
};
