const multer = require('multer');
const path = require('path');
const ApprenticePlanning = require('../models/ApprenticePlanning');
const Employee = require('../models/Employee');
const sftpService = require('../services/sftpService');
const { parseApprenticePlanningPdf } = require('../utils/parseApprenticePlanningPdf');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ok =
      file.mimetype === 'application/pdf' ||
      (file.originalname || '').toLowerCase().endsWith('.pdf');
    cb(ok ? null : new Error('Seuls les fichiers PDF sont acceptés'), ok);
  }
});

const uploadMiddleware = upload.single('file');

function normalizeSiteKey(v) {
  const s = String(v || '').toLowerCase();
  if (s === 'lon' || s === 'longuenesse') return 'lon';
  return 'plan';
}

function nasBasePath() {
  return process.env.SFTP_BASE_PATH || process.env.NAS_BASE_PATH || '/n8n/uploads/documents';
}

const listPlannings = async (req, res) => {
  try {
    const siteKey = normalizeSiteKey(req.query.siteKey || req.query.site);
    const rows = await ApprenticePlanning.find({ siteKey })
      .populate(
        'employeeId',
        'name contractType trainingDays contractEndDate role employeeCategory isActive'
      )
      .sort({ updatedAt: -1 })
      .lean();
    const data = rows.map((p) => ({
      ...p,
      shopPole: VALID_SHOP_POLES.has(p.shopPole)
        ? p.shopPole
        : inferShopPoleFromEmployee(p.employeeId)
    }));
    res.json({ success: true, data });
  } catch (err) {
    console.error('❌ listPlannings:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function isContractFinished(emp) {
  if (!emp) return true;
  if (emp.isActive === false) return true;
  if (!emp.contractEndDate) return false;
  const end = new Date(emp.contractEndDate);
  end.setHours(0, 0, 0, 0);
  return end < startOfToday();
}

const VALID_KINDS = new Set(['examen', 'cfa', 'insitu']);
const VALID_SHOP_POLES = new Set(['vente', 'preparation', 'boulanger']);

function inferShopPoleFromEmployee(employee) {
  if (!employee) return 'vente';
  const cat = String(employee.employeeCategory || '').toLowerCase();
  if (VALID_SHOP_POLES.has(cat)) return cat;
  const r = String(employee.role || '').toLowerCase();
  if (r.includes('boulanger')) return 'boulanger';
  if (r.includes('préparateur') || r.includes('preparateur') || r.includes('chef prod')) {
    return 'preparation';
  }
  return 'vente';
}

function normalizeShopPole(raw, employee) {
  const s = String(raw || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
  if (s === 'prepa' || s === 'preparation' || s === 'preparateur') return 'preparation';
  if (s === 'boulanger') return 'boulanger';
  if (s === 'vente' || s === 'vendeuse') return 'vente';
  return inferShopPoleFromEmployee(employee);
}

function isValidIso(s) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const [y, m, d] = s.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return (
    dt.getUTCFullYear() === y &&
    dt.getUTCMonth() === m - 1 &&
    dt.getUTCDate() === d
  );
}

function normalizeTrainingDates(raw) {
  if (!Array.isArray(raw)) return [];
  const out = new Set();
  for (const v of raw) {
    const s = String(v || '').trim().slice(0, 10);
    if (isValidIso(s)) out.add(s);
  }
  return [...out].sort();
}

function normalizeTrainingEntries(raw, fallbackDates = []) {
  const map = new Map();
  if (Array.isArray(raw)) {
    for (const row of raw) {
      if (typeof row === 'string') {
        const date = row.trim().slice(0, 10);
        if (isValidIso(date) && !map.has(date)) map.set(date, { date, kind: 'cfa' });
        continue;
      }
      const date = String(row?.date || '').trim().slice(0, 10);
      if (!isValidIso(date)) continue;
      const kind = VALID_KINDS.has(row?.kind) ? row.kind : 'cfa';
      map.set(date, { date, kind });
    }
  }
  if (map.size === 0 && Array.isArray(fallbackDates)) {
    for (const d of fallbackDates) {
      const date = String(d || '').trim().slice(0, 10);
      if (isValidIso(date)) map.set(date, { date, kind: 'cfa' });
    }
  }
  return [...map.values()].sort((a, b) => a.date.localeCompare(b.date));
}

function entriesFromPlanning(p) {
  if (Array.isArray(p.trainingEntries) && p.trainingEntries.length > 0) {
    return normalizeTrainingEntries(p.trainingEntries);
  }
  return normalizeTrainingEntries([], p.trainingDates || []);
}

/** Vue globale : uniquement apprentis actifs avec un planning déjà intégré */
const getGlobalView = async (req, res) => {
  try {
    const siteKey = normalizeSiteKey(req.query.siteKey || req.query.site);
    const plannings = await ApprenticePlanning.find({ siteKey })
      .populate(
        'employeeId',
        'name trainingDays contractEndDate contractType isActive role employeeCategory'
      )
      .lean();

    const data = plannings
      .filter((p) => {
        const emp = p.employeeId;
        if (!emp || emp.contractType !== 'Apprentissage') return false;
        if (isContractFinished(emp)) return false;
        return true;
      })
      .map((p) => {
        const emp = p.employeeId;
        const trainingEntries = entriesFromPlanning(p);
        const shopPole = VALID_SHOP_POLES.has(p.shopPole)
          ? p.shopPole
          : inferShopPoleFromEmployee(emp);
        return {
          employeeId: emp._id,
          name: emp.name,
          shopPole,
          trainingDays: emp.trainingDays || [],
          contractEndDate: emp.contractEndDate || null,
          planningId: p._id,
          fileName: p.originalName || p.fileName || null,
          hasFile: Boolean(p.filePath),
          uploadedAt: p.updatedAt || p.createdAt || null,
          datesSource: p.datesSource || 'none',
          trainingEntries,
          trainingDates: trainingEntries.map((e) => e.date)
        };
      })
      .sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''), 'fr'));

    res.json({ success: true, data });
  } catch (err) {
    console.error('❌ getGlobalView:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

const uploadPlanning = async (req, res) => {
  try {
    const siteKey = normalizeSiteKey(req.body?.siteKey || req.query?.siteKey);
    const employeeId = req.body?.employeeId;
    if (!employeeId) {
      return res.status(400).json({ success: false, error: 'Salarié obligatoire' });
    }
    if (!req.file?.buffer) {
      return res.status(400).json({ success: false, error: 'Fichier PDF obligatoire' });
    }

    const employee = await Employee.findById(employeeId).lean();
    if (!employee) {
      return res.status(404).json({ success: false, error: 'Salarié introuvable' });
    }
    if (employee.contractType !== 'Apprentissage') {
      return res.status(400).json({
        success: false,
        error: 'Ce salarié n’est pas en contrat d’apprentissage'
      });
    }

    const shopPole = normalizeShopPole(req.body?.shopPole, employee);

    const parsed = await parseApprenticePlanningPdf(req.file.buffer);
    const trainingEntries = normalizeTrainingEntries(
      parsed.trainingEntries || [],
      parsed.trainingDates || []
    );
    const trainingDates = trainingEntries.map((e) => e.date);
    const datesSource = parsed.source || 'none';
    const needsManualDates = trainingDates.length === 0;

    const safeName = String(employee.name || 'apprenti')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9_-]+/g, '_')
      .slice(0, 40);
    const stamp = Date.now();
    const year = new Date().getFullYear();
    const fileName = `${safeName}_${stamp}.pdf`;
    const remotePath = `${nasBasePath()}/apprentice-plannings/${year}/${fileName}`;

    if (process.env.SFTP_PASSWORD) {
      await sftpService.putBuffer(req.file.buffer, remotePath);
    } else {
      console.warn('⚠️ SFTP_PASSWORD absent — chemin NAS enregistré sans upload réel');
    }

    const uploadedByName = req.employeeName || req.user?.name || '';

    const existing = await ApprenticePlanning.findOne({ employeeId }).lean();
    const keepManualDates =
      needsManualDates &&
      existing?.datesSource === 'manual' &&
      ((Array.isArray(existing.trainingEntries) && existing.trainingEntries.length > 0) ||
        (Array.isArray(existing.trainingDates) && existing.trainingDates.length > 0));

    const keptEntries = keepManualDates ? entriesFromPlanning(existing) : trainingEntries;
    const keptDates = keptEntries.map((e) => e.date);

    const doc = await ApprenticePlanning.findOneAndUpdate(
      { employeeId },
      {
        $set: {
          siteKey,
          fileName,
          originalName: req.file.originalname || fileName,
          filePath: remotePath,
          mimeType: req.file.mimetype || 'application/pdf',
          trainingDates: keptDates,
          trainingEntries: keptEntries,
          datesSource: keepManualDates ? 'manual' : datesSource,
          shopPole,
          label: path.parse(req.file.originalname || '').name || '',
          uploadedByName
        }
      },
      { upsert: true, new: true }
    );

    const kindCounts = keptEntries.reduce((acc, e) => {
      acc[e.kind] = (acc[e.kind] || 0) + 1;
      return acc;
    }, {});

    res.json({
      success: true,
      data: doc,
      needsManualDates: needsManualDates && !keepManualDates,
      message:
        datesSource === 'pdf-mem'
          ? `Planning enregistré — ${keptDates.length} jour(s) détectés (CFA: ${kindCounts.cfa || 0}, In Situ: ${kindCounts.insitu || 0}, Examens: ${kindCounts.examen || 0}).`
          : keepManualDates
            ? 'PDF enregistré — les jours saisis manuellement ont été conservés.'
            : 'PDF enregistré, mais aucun jour détecté automatiquement. Saisissez les jours de formation manuellement.'
    });
  } catch (err) {
    console.error('❌ uploadPlanning:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

/** Création / mise à jour des jours sans PDF (saisie manuelle) */
const saveManualDates = async (req, res) => {
  try {
    const siteKey = normalizeSiteKey(req.body?.siteKey || req.query?.siteKey);
    const employeeId = req.body?.employeeId;
    const trainingEntries = normalizeTrainingEntries(
      req.body?.trainingEntries,
      req.body?.trainingDates
    );
    const trainingDates = trainingEntries.map((e) => e.date);

    if (!employeeId) {
      return res.status(400).json({ success: false, error: 'Salarié obligatoire' });
    }
    if (trainingDates.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Sélectionnez au moins un jour de formation'
      });
    }

    const employee = await Employee.findById(employeeId).lean();
    if (!employee) {
      return res.status(404).json({ success: false, error: 'Salarié introuvable' });
    }
    if (employee.contractType !== 'Apprentissage') {
      return res.status(400).json({
        success: false,
        error: 'Ce salarié n’est pas en contrat d’apprentissage'
      });
    }
    if (isContractFinished(employee)) {
      return res.status(400).json({
        success: false,
        error: 'Ce contrat d’apprentissage est terminé'
      });
    }

    const shopPole = normalizeShopPole(req.body?.shopPole, employee);
    const uploadedByName = req.employeeName || req.user?.name || '';
    const existing = await ApprenticePlanning.findOne({ employeeId });

    const doc = await ApprenticePlanning.findOneAndUpdate(
      { employeeId },
      {
        $set: {
          siteKey,
          trainingDates,
          trainingEntries,
          datesSource: 'manual',
          shopPole,
          uploadedByName,
          ...(existing
            ? {}
            : {
                fileName: 'saisie-manuelle.pdf',
                originalName: 'Saisie manuelle',
                filePath: '',
                mimeType: 'application/pdf',
                label: 'Saisie manuelle'
              })
        }
      },
      { upsert: true, new: true }
    );

    res.json({
      success: true,
      data: doc,
      message: `${trainingDates.length} jour(s) de formation enregistrés.`
    });
  } catch (err) {
    console.error('❌ saveManualDates:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

const updateTrainingDates = async (req, res) => {
  try {
    const trainingEntries = normalizeTrainingEntries(
      req.body?.trainingEntries,
      req.body?.trainingDates
    );
    const trainingDates = trainingEntries.map((e) => e.date);
    if (trainingDates.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Sélectionnez au moins un jour de formation'
      });
    }
    const existing = await ApprenticePlanning.findById(req.params.id)
      .populate('employeeId', 'role employeeCategory')
      .lean();
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Planning introuvable' });
    }
    const shopPole =
      req.body?.shopPole !== undefined
        ? normalizeShopPole(req.body.shopPole, existing.employeeId)
        : VALID_SHOP_POLES.has(existing.shopPole)
          ? existing.shopPole
          : inferShopPoleFromEmployee(existing.employeeId);

    const doc = await ApprenticePlanning.findByIdAndUpdate(
      req.params.id,
      { $set: { trainingDates, trainingEntries, datesSource: 'manual', shopPole } },
      { new: true }
    );
    if (!doc) {
      return res.status(404).json({ success: false, error: 'Planning introuvable' });
    }
    res.json({
      success: true,
      data: doc,
      message: `${trainingDates.length} jour(s) de formation enregistrés.`
    });
  } catch (err) {
    console.error('❌ updateTrainingDates:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

const downloadPlanning = async (req, res) => {
  try {
    const doc = await ApprenticePlanning.findById(req.params.id).populate('employeeId', 'name');
    if (!doc) {
      return res.status(404).json({ success: false, error: 'Planning introuvable' });
    }
    if (!doc.filePath) {
      return res.status(404).json({
        success: false,
        error: 'Aucun PDF officiel pour ce planning (saisie manuelle uniquement)'
      });
    }

    let buffer;
    try {
      buffer = await sftpService.downloadFile(doc.filePath);
    } catch (e) {
      console.error('downloadPlanning SFTP:', e.message);
      return res.status(502).json({
        success: false,
        error: 'Impossible de récupérer le fichier sur le NAS'
      });
    }

    const downloadName =
      doc.originalName ||
      `planning_${doc.employeeId?.name || 'apprenti'}.pdf`.replace(/\s+/g, '_');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${downloadName.replace(/"/g, '')}"`
    );
    res.send(buffer);
  } catch (err) {
    console.error('❌ downloadPlanning:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

const deletePlanning = async (req, res) => {
  try {
    const doc = await ApprenticePlanning.findByIdAndDelete(req.params.id);
    if (!doc) {
      return res.status(404).json({ success: false, error: 'Planning introuvable' });
    }
    res.json({ success: true });
  } catch (err) {
    console.error('❌ deletePlanning:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

module.exports = {
  uploadMiddleware,
  listPlannings,
  getGlobalView,
  uploadPlanning,
  saveManualDates,
  updateTrainingDates,
  downloadPlanning,
  deletePlanning
};
