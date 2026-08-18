const crypto = require('crypto');
const AuditSanitaireAlert = require('../models/AuditSanitaireAlert');

const ARRAS_ONLY_ERROR = 'Cette alerte n’est disponible que pour Arras';

function normalizeSite(raw) {
  const v = String(raw || '').toLowerCase().trim();
  if (v === 'plan' || v === 'arras') return 'arras';
  if (v === 'lon' || v === 'longuenesse') return 'longuenesse';
  return v;
}

function assertArras(site) {
  return site === 'arras';
}

function asString(value, max = 2000) {
  return String(value || '').trim().slice(0, max);
}

function normalizeFiles(files) {
  if (!Array.isArray(files)) return [];
  return files
    .map((f) => {
      if (typeof f === 'string') {
        return { name: asString(f, 300) || 'document.pdf', url: '', driveFileId: '' };
      }
      const driveFileId = asString(f.id || f.driveFileId || f.fileId, 128);
      const url = asString(
        f.url || f.webViewLink || f.webContentLink || f.link || '',
        2000
      );
      const name = asString(f.name || f.fileName || f.title, 300) || 'document.pdf';
      return { name, url, driveFileId };
    })
    .filter((f) => f.name);
}

function fileKey(file) {
  return asString(file.driveFileId || file.url || file.name, 500);
}

function mergeFiles(existingFiles, incomingFiles) {
  const out = Array.isArray(existingFiles) ? [...existingFiles] : [];
  const seen = new Set(out.map(fileKey).filter(Boolean));
  let added = 0;
  for (const file of incomingFiles || []) {
    const key = fileKey(file);
    if (key && seen.has(key)) continue;
    if (key) seen.add(key);
    out.push(file);
    added += 1;
  }
  return { files: out, added };
}

function buildDedupeKey({ gmailMessageId, files }) {
  const gmail = asString(gmailMessageId, 256);
  if (gmail) return `gmail:${gmail}`;
  const ids = (files || [])
    .map((f) => f.driveFileId || f.url)
    .filter(Boolean)
    .sort()
    .join('|');
  if (!ids) return '';
  return `files:${crypto.createHash('sha1').update(ids).digest('hex')}`;
}

async function findExistingAlert({ gmailMessageId, dedupeKey }) {
  if (gmailMessageId) {
    const byGmail = await AuditSanitaireAlert.findOne({
      site: 'arras',
      gmailMessageId
    }).sort({ createdAt: -1 });
    if (byGmail) return byGmail;
  }
  if (!dedupeKey) return null;
  return AuditSanitaireAlert.findOne({ site: 'arras', dedupeKey });
}

function toPublicAlert(doc) {
  if (!doc) return null;
  return {
    id: String(doc._id),
    site: doc.site,
    status: doc.status,
    receivedAt: doc.receivedAt,
    subject: doc.subject || '',
    driveFolderUrl: doc.driveFolderUrl || '',
    files: Array.isArray(doc.files) ? doc.files : [],
    printedAt: doc.printedAt,
    printedByName: doc.printedByName || ''
  };
}

function serializeAlerts(docs, isAdmin) {
  return (docs || []).map((doc) => {
    const pub = toPublicAlert(doc);
    if (!isAdmin) pub.driveFolderUrl = '';
    return pub;
  });
}

/**
 * POST /api/audit-sanitaire/from-n8n
 * Appelé par n8n après dépôt des PDF Mérieux sur Google Drive (Arras uniquement).
 */
async function fromN8n(req, res) {
  try {
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const site = normalizeSite(body.site || 'arras');
    if (!assertArras(site)) {
      return res.status(400).json({ success: false, error: ARRAS_ONLY_ERROR });
    }

    const files = normalizeFiles(body.files);
    const driveFolderUrl = asString(body.driveFolderUrl || body.folderUrl, 2000);
    const driveFolderId = asString(body.driveFolderId || body.folderId, 128);
    const gmailMessageId = asString(body.gmailMessageId || body.messageId, 256);
    const subject = asString(body.subject, 500);
    const receivedAtRaw = body.receivedAt || body.date;
    const receivedAt = receivedAtRaw ? new Date(receivedAtRaw) : new Date();
    const receivedAtSafe = Number.isNaN(receivedAt.getTime()) ? new Date() : receivedAt;

    if (!files.length && !driveFolderUrl && !driveFolderId) {
      return res.status(400).json({
        success: false,
        error: 'Indiquez au moins des fichiers ou un dossier Google Drive'
      });
    }

    const dedupeKey = buildDedupeKey({ gmailMessageId, files });
    const existing = await findExistingAlert({ gmailMessageId, dedupeKey });
    if (existing) {
      if (existing.status === 'pending') {
        const merged = mergeFiles(existing.files, files);
        existing.files = merged.files;
        if (!existing.subject && subject) existing.subject = subject;
        if (!existing.driveFolderUrl && driveFolderUrl) existing.driveFolderUrl = driveFolderUrl;
        if (!existing.driveFolderId && driveFolderId) existing.driveFolderId = driveFolderId;
        await existing.save();
      }
      return res.json({
        success: true,
        created: false,
        data: toPublicAlert(existing)
      });
    }

    const doc = await AuditSanitaireAlert.create({
      site: 'arras',
      status: 'pending',
      receivedAt: receivedAtSafe,
      subject,
      driveFolderUrl,
      driveFolderId,
      files,
      dedupeKey: dedupeKey || undefined,
      gmailMessageId
    });

    console.log('✅ Alerte audit sanitaire Arras créée:', {
      id: String(doc._id),
      files: files.length,
      subject
    });

    return res.status(201).json({
      success: true,
      created: true,
      data: toPublicAlert(doc)
    });
  } catch (err) {
    if (err && err.code === 11000) {
      const or = [];
      const gmail = asString(req.body?.gmailMessageId || req.body?.messageId, 256);
      const folderId = asString(req.body?.driveFolderId || req.body?.folderId, 128);
      const folderUrl = asString(req.body?.driveFolderUrl || req.body?.folderUrl, 2000);
      if (gmail) or.push({ gmailMessageId: gmail });
      if (folderId) or.push({ driveFolderId: folderId });
      if (folderUrl) or.push({ driveFolderUrl: folderUrl });
      const existing = or.length
        ? await AuditSanitaireAlert.findOne({ site: 'arras', $or: or })
        : null;
      if (existing) {
        return res.json({ success: true, created: false, data: toPublicAlert(existing) });
      }
    }
    console.error('❌ auditSanitaire fromN8n:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * GET /api/audit-sanitaire/pending — bandeau Filmara Arras.
 */
async function listPending(req, res) {
  try {
    const site = normalizeSite(req.query.site || 'arras');
    if (!assertArras(site)) {
      return res.json({ success: true, data: [] });
    }
    const alerts = await AuditSanitaireAlert.find({ site: 'arras', status: 'pending' })
      .sort({ receivedAt: -1 })
      .limit(20)
      .lean();
    return res.json({
      success: true,
      data: serializeAlerts(alerts, req.user?.role === 'admin')
    });
  } catch (err) {
    console.error('❌ auditSanitaire listPending:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * GET /api/audit-sanitaire/history — liste complète Arras (à imprimer + déjà imprimés).
 */
async function listHistory(req, res) {
  try {
    const site = normalizeSite(req.query.site || 'arras');
    if (!assertArras(site)) {
      return res.json({ success: true, data: [] });
    }
    const alerts = await AuditSanitaireAlert.find({ site: 'arras' })
      .sort({ receivedAt: -1 })
      .limit(200)
      .lean();
    return res.json({
      success: true,
      data: serializeAlerts(alerts, req.user?.role === 'admin')
    });
  } catch (err) {
    console.error('❌ auditSanitaire listHistory:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * POST /api/audit-sanitaire/:id/printed
 */
async function markPrinted(req, res) {
  try {
    const id = String(req.params.id || '').trim();
    if (!id) {
      return res.status(400).json({ success: false, error: 'Identifiant manquant' });
    }
    const doc = await AuditSanitaireAlert.findOne({ _id: id, site: 'arras' });
    if (!doc) {
      return res.status(404).json({ success: false, error: 'Alerte introuvable' });
    }
    if (doc.status === 'printed') {
      return res.json({ success: true, data: toPublicAlert(doc) });
    }
    const printedByName = asString(
      req.employeeName || req.user?.name || req.user?.email || 'équipe',
      200
    );
    doc.status = 'printed';
    doc.printedAt = new Date();
    doc.printedByName = printedByName;
    await doc.save();
    return res.json({ success: true, data: toPublicAlert(doc) });
  } catch (err) {
    console.error('❌ auditSanitaire markPrinted:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}

module.exports = {
  fromN8n,
  listPending,
  listHistory,
  markPrinted
};
