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
      .populate('employeeId', 'name contractType trainingDays contractEndDate')
      .sort({ updatedAt: -1 })
      .lean();
    res.json({ success: true, data: rows });
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

function normalizeTrainingDates(raw) {
  if (!Array.isArray(raw)) return [];
  const out = new Set();
  for (const v of raw) {
    const s = String(v || '').trim().slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) continue;
    const [y, m, d] = s.split('-').map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d));
    if (
      dt.getUTCFullYear() === y &&
      dt.getUTCMonth() === m - 1 &&
      dt.getUTCDate() === d
    ) {
      out.add(s);
    }
  }
  return [...out].sort();
}

/** Vue globale : uniquement apprentis actifs avec un planning déjà intégré */
const getGlobalView = async (req, res) => {
  try {
    const siteKey = normalizeSiteKey(req.query.siteKey || req.query.site);
    const plannings = await ApprenticePlanning.find({ siteKey })
      .populate('employeeId', 'name trainingDays contractEndDate contractType isActive')
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
        return {
          employeeId: emp._id,
          name: emp.name,
          trainingDays: emp.trainingDays || [],
          contractEndDate: emp.contractEndDate || null,
          planningId: p._id,
          fileName: p.originalName || p.fileName || null,
          hasFile: Boolean(p.filePath),
          uploadedAt: p.updatedAt || p.createdAt || null,
          datesSource: p.datesSource || 'none',
          trainingDates: Array.isArray(p.trainingDates) ? p.trainingDates : []
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

    const parsed = await parseApprenticePlanningPdf(req.file.buffer);
    const trainingDates = parsed.trainingDates || [];
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
      Array.isArray(existing.trainingDates) &&
      existing.trainingDates.length > 0;

    const doc = await ApprenticePlanning.findOneAndUpdate(
      { employeeId },
      {
        $set: {
          siteKey,
          fileName,
          originalName: req.file.originalname || fileName,
          filePath: remotePath,
          mimeType: req.file.mimetype || 'application/pdf',
          trainingDates: keepManualDates ? existing.trainingDates : trainingDates,
          datesSource: keepManualDates ? 'manual' : datesSource,
          label: path.parse(req.file.originalname || '').name || '',
          uploadedByName
        }
      },
      { upsert: true, new: true }
    );

    res.json({
      success: true,
      data: doc,
      needsManualDates: needsManualDates && !keepManualDates,
      message:
        datesSource === 'pdf-mem'
          ? `Planning enregistré — ${trainingDates.length} jour(s) de formation détectés dans le PDF.`
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
    const trainingDates = normalizeTrainingDates(req.body?.trainingDates);

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

    const uploadedByName = req.employeeName || req.user?.name || '';
    const existing = await ApprenticePlanning.findOne({ employeeId });

    const doc = await ApprenticePlanning.findOneAndUpdate(
      { employeeId },
      {
        $set: {
          siteKey,
          trainingDates,
          datesSource: 'manual',
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
    const trainingDates = normalizeTrainingDates(req.body?.trainingDates);
    if (trainingDates.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Sélectionnez au moins un jour de formation'
      });
    }
    const doc = await ApprenticePlanning.findByIdAndUpdate(
      req.params.id,
      { $set: { trainingDates, datesSource: 'manual' } },
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
