const axios = require('axios');
const sftpService = require('./sftpService');

const MAX_PDF_BYTES = 15 * 1024 * 1024;

let nasQueue = Promise.resolve();

function withNasLock(fn) {
  const run = nasQueue.then(fn, fn);
  nasQueue = run.then(
    () => undefined,
    () => undefined
  );
  return run;
}

function asString(value, max = 2000) {
  return String(value || '').trim().slice(0, max);
}

function safeFileName(name) {
  const cleaned = asString(name, 180)
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, '_')
    .replace(/\s+/g, ' ')
    .trim();
  return cleaned || 'document.pdf';
}

function safeFolder(id) {
  const cleaned = asString(id, 80).replace(/[^a-zA-Z0-9_-]/g, '_');
  return cleaned || 'lot';
}

function looksLikePdf(buffer, contentType) {
  if (!buffer || buffer.length < 5) return false;
  if (buffer.slice(0, 4).toString('utf8') === '%PDF') return true;
  const ct = String(contentType || '').toLowerCase();
  return ct.includes('pdf') || ct.includes('octet-stream');
}

function driveDownloadUrls(file) {
  const urls = [];
  const url = asString(file.url, 2000);
  const id = asString(file.driveFileId, 128);
  if (url.startsWith('http')) urls.push(url);
  if (id) {
    urls.push(`https://drive.google.com/uc?export=download&id=${encodeURIComponent(id)}&confirm=t`);
    urls.push(`https://drive.google.com/uc?id=${encodeURIComponent(id)}&export=download`);
  }
  return [...new Set(urls)];
}

async function downloadFromDrive(file) {
  const urls = driveDownloadUrls(file);
  let lastError = 'Aucune URL Drive';
  for (const url of urls) {
    try {
      const res = await axios.get(url, {
        responseType: 'arraybuffer',
        maxRedirects: 5,
        timeout: 60000,
        maxContentLength: MAX_PDF_BYTES,
        headers: {
          'User-Agent': 'FilmaraAuditSanitaire/1.0'
        },
        validateStatus: (s) => s >= 200 && s < 400
      });
      const buffer = Buffer.from(res.data);
      const ct = res.headers['content-type'];
      if (!looksLikePdf(buffer, ct)) {
        lastError = `Réponse Drive non PDF (${ct || 'type inconnu'})`;
        continue;
      }
      return buffer;
    } catch (err) {
      lastError = err.message;
    }
  }
  throw new Error(lastError);
}

function nasRemotePath(file, meta) {
  const year = (meta.receivedAt instanceof Date && !Number.isNaN(meta.receivedAt.getTime())
    ? meta.receivedAt
    : new Date()
  ).getFullYear();
  const folder = safeFolder(meta.gmailMessageId || 'sans-mail');
  const base = sftpService.basePath || '/n8n/uploads/documents';
  return `${base}/audit-sanitaire/arras/${year}/${folder}/${safeFileName(file.name)}`;
}

async function archiveOneFile(file, meta) {
  if (!file || file.nasPath) return { file, stored: Boolean(file?.nasPath) };
  if (!file.driveFileId && !file.url) return { file, stored: false };

  const buffer = await downloadFromDrive(file);
  const remotePath = nasRemotePath(file, meta);
  await withNasLock(() => sftpService.putBuffer(buffer, remotePath));
  return {
    file: {
      name: file.name,
      url: '',
      driveFileId: file.driveFileId || '',
      nasPath: remotePath
    },
    stored: true
  };
}

/**
 * Copie les PDF encore sur Drive vers le NAS. Ne lève pas : un échec laisse le lien Drive.
 */
async function archiveFilesToNas(files, meta) {
  const list = Array.isArray(files) ? files : [];
  const out = [];
  const storedDriveIds = [];
  for (const file of list) {
    try {
      const result = await archiveOneFile(file, meta);
      out.push(result.file);
      if (result.stored && result.file.driveFileId && result.file.nasPath) {
        storedDriveIds.push(result.file.driveFileId);
      }
    } catch (err) {
      console.error('❌ Copie Drive → NAS (audit sanitaire):', file?.name, err.message);
      out.push(file);
    }
  }
  return { files: out, storedDriveIds };
}

module.exports = {
  archiveFilesToNas
};
