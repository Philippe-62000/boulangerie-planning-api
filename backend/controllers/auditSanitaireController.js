const crypto = require('crypto');
const AuditSanitaireAlert = require('../models/AuditSanitaireAlert');
const sftpService = require('../services/sftpService');
const { archiveFilesToNas } = require('../services/auditSanitaireStorage');

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
      const nasPath = asString(f.nasPath, 500);
      return { name, url, driveFileId, nasPath };
    })
    .filter((f) => f.name);
}

function fileKey(file) {
  return asString(file.driveFileId || file.url || file.name, 500);
}

function mergeFiles(existingFiles, incomingFiles) {
  const out = Array.isArray(existingFiles)
    ? existingFiles.map((f) => ({
        name: f.name,
        url: f.url || '',
        driveFileId: f.driveFileId || '',
        nasPath: f.nasPath || ''
      }))
    : [];
  const indexByKey = new Map();
  out.forEach((f, i) => {
    const key = fileKey(f);
    if (key) indexByKey.set(key, i);
  });
  let added = 0;
  for (const file of incomingFiles || []) {
    const key = fileKey(file);
    if (key && indexByKey.has(key)) {
      const i = indexByKey.get(key);
      const prev = out[i];
      const nasPath = file.nasPath || prev.nasPath || '';
      out[i] = {
        name: file.name || prev.name,
        url: nasPath ? '' : file.url || prev.url || '',
        driveFileId: file.driveFileId || prev.driveFileId || '',
        nasPath
      };
      continue;
    }
    if (key) indexByKey.set(key, out.length);
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

function toPublicFile(file, index) {
  const nasStored = Boolean(file?.nasPath);
  return {
    name: file?.name || 'document.pdf',
    nasStored,
    index,
    url: nasStored ? '' : asString(file?.url, 2000),
    driveFileId: nasStored ? '' : asString(file?.driveFileId, 128)
  };
}

function toPublicAlert(doc) {
  if (!doc) return null;
  const files = Array.isArray(doc.files) ? doc.files.map((f, i) => toPublicFile(f, i)) : [];
  const allOnNas = files.length > 0 && files.every((f) => f.nasStored);
  return {
    id: String(doc._id),
    site: doc.site,
    status: doc.status,
    receivedAt: doc.receivedAt,
    subject: doc.subject || '',
    driveFolderUrl: allOnNas ? '' : doc.driveFolderUrl || '',
    files,
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
        const archivedIncoming = await archiveFilesToNas(files, {
          gmailMessageId: existing.gmailMessageId || gmailMessageId,
          receivedAt: existing.receivedAt || receivedAtSafe
        });
        const merged = mergeFiles(existing.files, archivedIncoming.files);
        existing.files = merged.files;
        if (!existing.subject && subject) existing.subject = subject;
        if (!existing.driveFolderUrl && driveFolderUrl) existing.driveFolderUrl = driveFolderUrl;
        if (!existing.driveFolderId && driveFolderId) existing.driveFolderId = driveFolderId;
        await existing.save();
        return res.json({
          success: true,
          created: false,
          storedOnNas: archivedIncoming.storedDriveIds.length > 0,
          driveFileIdToDelete: archivedIncoming.storedDriveIds[0] || '',
          deleteFromDrive: archivedIncoming.storedDriveIds,
          data: toPublicAlert(existing)
        });
      }
      return res.json({
        success: true,
        created: false,
        storedOnNas: false,
        driveFileIdToDelete: '',
        deleteFromDrive: [],
        data: toPublicAlert(existing)
      });
    }

    const archived = await archiveFilesToNas(files, {
      gmailMessageId,
      receivedAt: receivedAtSafe
    });

    const doc = await AuditSanitaireAlert.create({
      site: 'arras',
      status: 'pending',
      receivedAt: receivedAtSafe,
      subject,
      driveFolderUrl,
      driveFolderId,
      files: archived.files,
      dedupeKey: dedupeKey || undefined,
      gmailMessageId
    });

    console.log('✅ Alerte audit sanitaire Arras créée:', {
      id: String(doc._id),
      files: archived.files.length,
      nas: archived.storedDriveIds.length,
      subject
    });

    return res.status(201).json({
      success: true,
      created: true,
      storedOnNas: archived.storedDriveIds.length > 0,
      driveFileIdToDelete: archived.storedDriveIds[0] || '',
      deleteFromDrive: archived.storedDriveIds,
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

function contentDisposition(fileName, inline) {
  const safe = asString(fileName, 180).replace(/"/g, '') || 'document.pdf';
  const type = inline ? 'inline' : 'attachment';
  return `${type}; filename="${safe}"`;
}

/**
 * GET /api/audit-sanitaire/:id/files/:index/download
 */
async function downloadFile(req, res) {
  try {
    const id = String(req.params.id || '').trim();
    const index = Number.parseInt(req.params.index, 10);
    if (!id || Number.isNaN(index) || index < 0) {
      return res.status(400).json({ success: false, error: 'Fichier invalide' });
    }
    const doc = await AuditSanitaireAlert.findOne({ _id: id, site: 'arras' });
    if (!doc) {
      return res.status(404).json({ success: false, error: 'Alerte introuvable' });
    }
    const file = Array.isArray(doc.files) ? doc.files[index] : null;
    if (!file) {
      return res.status(404).json({ success: false, error: 'Fichier introuvable' });
    }

    if (!file.nasPath && (file.driveFileId || file.url)) {
      const archived = await archiveFilesToNas([file], {
        gmailMessageId: doc.gmailMessageId,
        receivedAt: doc.receivedAt
      });
      if (archived.files[0]) {
        doc.files[index] = archived.files[0];
        await doc.save();
      }
    }

    const current = doc.files[index];
    if (!current?.nasPath) {
      return res.status(404).json({
        success: false,
        error: 'Fichier pas encore copié sur le NAS'
      });
    }

    const buffer = await sftpService.downloadFile(current.nasPath);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', contentDisposition(current.name, true));
    res.setHeader('Content-Length', buffer.length);
    return res.send(buffer);
  } catch (err) {
    console.error('❌ auditSanitaire downloadFile:', err);
    if (!res.headersSent) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }
}

module.exports = {
  fromN8n,
  listPending,
  listHistory,
  markPrinted,
  downloadFile
};
