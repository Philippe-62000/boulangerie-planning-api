const multer = require('multer');
const pdfParse = require('pdf-parse');
const BeverageOrderProposal = require('../models/BeverageOrderProposal');
const { parseCrisalidInvendusText } = require('../utils/parseCrisalidInvendusPdf');

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

function computeToOrder(consumedQty, stockQty, marginPercent) {
  const consumed = Math.max(0, Number(consumedQty) || 0);
  const stock = Math.max(0, Number(stockQty) || 0);
  const margin = Math.max(0, Number(marginPercent) || 0);
  const need = Math.ceil(consumed * (1 + margin / 100));
  return Math.max(0, need - stock);
}

const uploadMiddleware = upload.single('file');

/** POST /api/beverage-orders/parse — upload PDF Crisalid, retourne les lignes parsées */
const parsePdf = async (req, res) => {
  try {
    if (!req.file?.buffer) {
      return res.status(400).json({ success: false, error: 'Fichier PDF manquant' });
    }
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
    const products = [];
    for (const cat of categories) {
      for (const p of cat.products) {
        products.push({
          category: cat.name,
          name: p.name,
          ventesQty: p.ventesQty,
          offertsQty: p.offertsQty,
          consumedQty: p.consumedQty,
          stockQty: 0,
          marginPercent,
          toOrderQty: computeToOrder(p.consumedQty, 0, marginPercent)
        });
      }
    }

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
        note: 'Commande le jeudi pour livraison le mardi — besoin ≈ conso semaine + marge − stock restant'
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

function extractPeriodHint(text) {
  const m = String(text).match(/Périodes?\s*\n?([0-9,\s]+)/i);
  if (m) return String(m[1]).replace(/\s+/g, '').slice(0, 120);
  const d = String(text).match(/Edité le\s+(\d{2}\/\d{2}\/\d{4})/i);
  return d ? `Édité le ${d[1]}` : '';
}

/** POST /api/beverage-orders — enregistre une proposition (stocks saisis) */
const saveProposal = async (req, res) => {
  try {
    const siteKey = normalizeSiteKey(req.body?.siteKey || req.query?.siteKey);
    const marginPercent = Math.max(0, Number(req.body?.marginPercent) || 10);
    const productsIn = Array.isArray(req.body?.products) ? req.body.products : [];
    if (!productsIn.length) {
      return res.status(400).json({ success: false, error: 'Aucun produit à enregistrer' });
    }

    const products = productsIn.map((p) => {
      const consumedQty = Math.max(
        0,
        Number(p.consumedQty != null ? p.consumedQty : (Number(p.ventesQty) || 0) + (Number(p.offertsQty) || 0))
      );
      const stockQty = Math.max(0, Number(p.stockQty) || 0);
      const lineMargin =
        p.marginPercent != null && p.marginPercent !== ''
          ? Math.max(0, Number(p.marginPercent))
          : marginPercent;
      return {
        category: String(p.category || '').trim() || 'Divers',
        name: String(p.name || '').trim(),
        ventesQty: Math.max(0, Number(p.ventesQty) || 0),
        offertsQty: Math.max(0, Number(p.offertsQty) || 0),
        consumedQty,
        stockQty,
        marginPercent: lineMargin,
        toOrderQty: computeToOrder(consumedQty, stockQty, lineMargin)
      };
    }).filter((p) => p.name);

    const doc = await BeverageOrderProposal.create({
      siteKey,
      periodLabel: String(req.body?.periodLabel || '').trim(),
      sourceFileName: String(req.body?.sourceFileName || '').trim(),
      marginPercent,
      note: String(req.body?.note || 'Commande le jeudi pour livraison le mardi').trim(),
      products
    });

    res.json({ success: true, data: doc });
  } catch (err) {
    console.error('❌ beverageOrders.saveProposal:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

/** GET /api/beverage-orders — historique récent */
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

/** GET /api/beverage-orders/:id */
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

/** DELETE /api/beverage-orders/:id */
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
  computeToOrder
};
