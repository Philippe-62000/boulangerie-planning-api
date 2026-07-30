const multer = require('multer');
const path = require('path');
const ApprenticePlanning = require('../models/ApprenticePlanning');
const Employee = require('../models/Employee');
const sftpService = require('../services/sftpService');
const {
  parseApprenticePlanningPdf,
  expandWeekdaysToDates
} = require('../utils/parseApprenticePlanningPdf');

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

function schoolYearStartFromDates(dates) {
  if (!dates || dates.length === 0) {
    const now = new Date();
    const y = now.getFullYear();
    return now.getMonth() >= 8 ? y : y - 1;
  }
  const first = dates.slice().sort()[0];
  const [y, m] = first.split('-').map(Number);
  return m >= 9 ? y : y - 1;
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

/** Vue globale : apprentis + jours de formation + lien PDF */
const getGlobalView = async (req, res) => {
  try {
    const siteKey = normalizeSiteKey(req.query.siteKey || req.query.site);
    const apprentices = await Employee.find({ contractType: 'Apprentissage' })
      .select('name trainingDays contractEndDate')
      .sort({ name: 1 })
      .lean();
    const plannings = await ApprenticePlanning.find({ siteKey }).lean();
    const byEmp = new Map(plannings.map((p) => [String(p.employeeId), p]));

    const data = apprentices.map((emp) => {
      const p = byEmp.get(String(emp._id));
      let trainingDates = p?.trainingDates || [];
      let datesSource = p?.datesSource || 'none';
      if ((!trainingDates || trainingDates.length === 0) && emp.trainingDays?.length) {
        const sy = schoolYearStartFromDates([]);
        trainingDates = expandWeekdaysToDates(emp.trainingDays, sy);
        datesSource = 'weekdays';
      }
      return {
        employeeId: emp._id,
        name: emp.name,
        trainingDays: emp.trainingDays || [],
        contractEndDate: emp.contractEndDate || null,
        planningId: p?._id || null,
        fileName: p?.originalName || p?.fileName || null,
        uploadedAt: p?.updatedAt || p?.createdAt || null,
        datesSource,
        trainingDates
      };
    });

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
    let trainingDates = parsed.trainingDates || [];
    let datesSource = parsed.source || 'none';

    if (trainingDates.length === 0 && employee.trainingDays?.length) {
      const sy = schoolYearStartFromDates([]);
      trainingDates = expandWeekdaysToDates(employee.trainingDays, sy);
      datesSource = 'weekdays';
    }

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

    const doc = await ApprenticePlanning.findOneAndUpdate(
      { employeeId },
      {
        $set: {
          siteKey,
          fileName,
          originalName: req.file.originalname || fileName,
          filePath: remotePath,
          mimeType: req.file.mimetype || 'application/pdf',
          trainingDates,
          datesSource,
          label: path.parse(req.file.originalname || '').name || '',
          uploadedByName
        }
      },
      { upsert: true, new: true }
    );

    res.json({
      success: true,
      data: doc,
      message:
        datesSource === 'pdf-mem'
          ? `Planning enregistré — ${trainingDates.length} jour(s) de formation détectés dans le PDF.`
          : datesSource === 'weekdays'
            ? `Planning enregistré — jours dérivés des jours de formation du salarié (${trainingDates.length}).`
            : 'Planning enregistré. Aucun jour de formation détecté automatiquement (téléchargement PDF disponible).'
    });
  } catch (err) {
    console.error('❌ uploadPlanning:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

const downloadPlanning = async (req, res) => {
  try {
    const doc = await ApprenticePlanning.findById(req.params.id).populate('employeeId', 'name');
    if (!doc) {
      return res.status(404).json({ success: false, error: 'Planning introuvable' });
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
  downloadPlanning,
  deletePlanning
};
