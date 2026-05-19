/**
 * Controller Positive — comptage d'inventaire via Gemini Vision.
 */

const PositiveCatalog = require('../models/PositiveCatalog');
const PositiveScan = require('../models/PositiveScan');
const positiveService = require('../services/positiveService');

// ───────────────────────────────────────────────────────────────────
// Rate limiting simple en mémoire (par process). Permet d'éviter qu'un
// utilisateur saturé le quota Gemini gratuit (1500 req/jour partagés).
// Au prochain reboot du serveur tout est remis à zéro — acceptable pour un MVP.
// ───────────────────────────────────────────────────────────────────

const MAX_PHOTOS_PER_SCAN = 10;
const MAX_SCANS_PER_USER_PER_DAY = 10;
const MAX_PHOTOS_GLOBAL_PER_DAY = 1000;

const dailyUserCount = new Map(); // key = `${dayKey}|${userId}` → number
let globalPhotosToday = { dayKey: '', count: 0 };

function currentDayKey() {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD UTC
}

function checkRateLimits(userId, requestedPhotos) {
  const day = currentDayKey();

  if (globalPhotosToday.dayKey !== day) {
    globalPhotosToday = { dayKey: day, count: 0 };
  }
  if (globalPhotosToday.count + requestedPhotos > MAX_PHOTOS_GLOBAL_PER_DAY) {
    return {
      ok: false,
      message: `Quota global quotidien atteint (${MAX_PHOTOS_GLOBAL_PER_DAY} photos/jour). Réessayer demain.`
    };
  }

  const userKey = `${day}|${userId}`;
  const userCount = dailyUserCount.get(userKey) || 0;
  if (userCount + 1 > MAX_SCANS_PER_USER_PER_DAY) {
    return {
      ok: false,
      message: `Quota personnel atteint (${MAX_SCANS_PER_USER_PER_DAY} scans/jour). Réessayer demain.`
    };
  }

  return {
    ok: true,
    commit() {
      dailyUserCount.set(userKey, userCount + 1);
      globalPhotosToday.count += requestedPhotos;
    }
  };
}

// ───────────────────────────────────────────────────────────────────
// POST /api/positive/scan
// ───────────────────────────────────────────────────────────────────

async function scan(req, res) {
  try {
    const files = req.files || [];
    if (!files.length) {
      return res.status(400).json({ success: false, error: 'Aucune photo fournie.' });
    }
    if (files.length > MAX_PHOTOS_PER_SCAN) {
      return res.status(400).json({
        success: false,
        error: `Maximum ${MAX_PHOTOS_PER_SCAN} photos par scan (${files.length} reçues).`
      });
    }

    const userId = req.user?.id || req.user?.employeeId || 'anonymous';
    const limit = checkRateLimits(userId, files.length);
    if (!limit.ok) {
      return res.status(429).json({ success: false, error: limit.message });
    }

    const lieu = (req.body?.lieu || '').toString().slice(0, 200);
    const note = (req.body?.note || '').toString().slice(0, 500);
    const rawMode = String(req.body?.photoMode || req.body?.mergeMode || 'distinct').trim();
    const photoMode = rawMode === 'same_shelf' ? 'same_shelf' : 'distinct';

    if (photoMode === 'same_shelf' && files.length > positiveService.MAX_PHOTOS_SAME_SHELF) {
      return res.status(400).json({
        success: false,
        error: `Maximum ${positiveService.MAX_PHOTOS_SAME_SHELF} photos en mode « même étagère » (${files.length} reçues).`
      });
    }

    const catalog = await PositiveCatalog.getOrCreate();
    const { photos, totals, mergeMode } = await positiveService.analyzeBatch({
      files,
      lieu,
      note,
      catalog: { products: catalog.products, excluded: catalog.excluded },
      mergeMode: photoMode
    });

    // Si au moins une photo a vraiment marché, on commit le compteur
    const hasAtLeastOneSuccess = photos.some((p) => !p.error);
    if (hasAtLeastOneSuccess) limit.commit();

    const scanDoc = await PositiveScan.create({
      operatorId: userId !== 'anonymous' ? userId : undefined,
      operatorName: req.user?.name || '',
      lieu,
      note,
      photoMode: mergeMode || photoMode,
      photosCount: files.length,
      photos,
      totals,
      catalogSnapshotSize: catalog.products.length
    });

    res.json({
      success: true,
      scanId: scanDoc._id,
      lieu,
      note,
      photoMode: mergeMode || photoMode,
      photos,
      totals
    });
  } catch (err) {
    console.error('❌ [positive] scan error:', err);
    res.status(500).json({
      success: false,
      error: err.message || 'Erreur lors de l\'analyse'
    });
  }
}

// ───────────────────────────────────────────────────────────────────
// GET /api/positive/catalog
// ───────────────────────────────────────────────────────────────────

async function getCatalog(req, res) {
  try {
    const catalog = await PositiveCatalog.getOrCreate();
    res.json({
      success: true,
      catalog: {
        products: catalog.products,
        excluded: catalog.excluded,
        updatedAt: catalog.updatedAt
      }
    });
  } catch (err) {
    console.error('❌ [positive] getCatalog error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
}

// ───────────────────────────────────────────────────────────────────
// PUT /api/positive/catalog
// Body : { products: [{ canonical, aliases?: string[] }], excluded: string[] }
// ───────────────────────────────────────────────────────────────────

async function updateCatalog(req, res) {
  try {
    const { products, excluded } = req.body || {};
    if (!Array.isArray(products) || !Array.isArray(excluded)) {
      return res.status(400).json({
        success: false,
        error: 'Format invalide : products[] et excluded[] requis.'
      });
    }

    // Nettoyage / validation simple
    const cleanProducts = products
      .map((p) => ({
        canonical: String(p?.canonical || '').trim(),
        aliases: Array.isArray(p?.aliases)
          ? p.aliases.map((a) => String(a || '').trim()).filter(Boolean)
          : [],
        category: String(p?.category || '').trim(),
        notes: String(p?.notes || '').trim()
      }))
      .filter((p) => p.canonical.length > 0);

    // S'assurer que le canonical est dans les alias (pour la normalisation)
    for (const p of cleanProducts) {
      if (!p.aliases.some((a) => a.toLowerCase() === p.canonical.toLowerCase())) {
        p.aliases.unshift(p.canonical);
      }
    }

    const cleanExcluded = excluded
      .map((e) => String(e || '').trim())
      .filter((e) => e.length > 0);

    const catalog = await PositiveCatalog.getOrCreate();
    catalog.products = cleanProducts;
    catalog.excluded = cleanExcluded;
    await catalog.save();

    res.json({
      success: true,
      catalog: {
        products: catalog.products,
        excluded: catalog.excluded,
        updatedAt: catalog.updatedAt
      }
    });
  } catch (err) {
    console.error('❌ [positive] updateCatalog error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
}

// ───────────────────────────────────────────────────────────────────
// GET /api/positive/scans  (historique - liste résumée)
// ───────────────────────────────────────────────────────────────────

async function listScans(req, res) {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 200);
    const scans = await PositiveScan.find({}, {
      lieu: 1,
      note: 1,
      photosCount: 1,
      totals: 1,
      operatorName: 1,
      createdAt: 1
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    const enriched = scans.map((s) => ({
      _id: s._id,
      createdAt: s.createdAt,
      operatorName: s.operatorName || '',
      lieu: s.lieu || '',
      note: s.note || '',
      photosCount: s.photosCount || 0,
      productsCount: (s.totals || []).reduce((acc, t) => acc + (t.count || 0), 0),
      distinctProducts: (s.totals || []).length
    }));

    res.json({ success: true, scans: enriched });
  } catch (err) {
    console.error('❌ [positive] listScans error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
}

// ───────────────────────────────────────────────────────────────────
// GET /api/positive/scans/:id  (détail)
// ───────────────────────────────────────────────────────────────────

async function getScan(req, res) {
  try {
    const scan = await PositiveScan.findById(req.params.id).lean();
    if (!scan) return res.status(404).json({ success: false, error: 'Scan introuvable' });
    res.json({ success: true, scan });
  } catch (err) {
    console.error('❌ [positive] getScan error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
}

// ───────────────────────────────────────────────────────────────────
// DELETE /api/positive/scans/:id
// ───────────────────────────────────────────────────────────────────

async function deleteScan(req, res) {
  try {
    const removed = await PositiveScan.findByIdAndDelete(req.params.id);
    if (!removed) return res.status(404).json({ success: false, error: 'Scan introuvable' });
    res.json({ success: true });
  } catch (err) {
    console.error('❌ [positive] deleteScan error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
}

module.exports = {
  scan,
  getCatalog,
  updateCatalog,
  listScans,
  getScan,
  deleteScan,
  // exposé pour tests / réutilisation interne
  _constants: { MAX_PHOTOS_PER_SCAN, MAX_SCANS_PER_USER_PER_DAY, MAX_PHOTOS_GLOBAL_PER_DAY }
};
