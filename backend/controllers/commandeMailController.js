const crypto = require('crypto');
const CommandeMail = require('../models/CommandeMail');

const ARRAS_ONLY_ERROR = 'Les commandes mail ne sont disponibles que pour Arras';
const TEXT_MAX = 80000;
const HTML_MAX = 150000;

function normalizeSite(raw) {
  const v = String(raw || '').toLowerCase().trim();
  if (v === 'plan' || v === 'arras') return 'arras';
  if (v === 'lon' || v === 'longuenesse') return 'longuenesse';
  return v;
}

function asString(value, max = 2000) {
  return String(value == null ? '' : value).trim().slice(0, max);
}

function firstHeader(headers, name) {
  if (!Array.isArray(headers)) return '';
  const wanted = String(name || '').toLowerCase();
  const found = headers.find((h) => String(h?.name || '').toLowerCase() === wanted);
  return found ? asString(found.value, 1000) : '';
}

function extractFromPayload(body) {
  const payload = body.payload && typeof body.payload === 'object' ? body.payload : {};
  const headers = payload.headers || body.headers || [];
  return {
    from: asString(
      body.from || body.From || body.sender || firstHeader(headers, 'From'),
      500
    ),
    to: asString(body.to || body.To || firstHeader(headers, 'To'), 1000),
    subject: asString(
      body.subject || body.Subject || firstHeader(headers, 'Subject'),
      500
    ),
    dateRaw:
      body.receivedAt ||
      body.date ||
      body.Date ||
      firstHeader(headers, 'Date')
  };
}

function normalizeAttachments(files) {
  if (!Array.isArray(files)) return [];
  return files
    .map((f) => {
      if (typeof f === 'string') {
        return { name: asString(f, 300) || 'piece-jointe', url: '', contentType: '', driveFileId: '' };
      }
      const driveFileId = asString(f.id || f.driveFileId || f.fileId, 128);
      const url = asString(
        f.url || f.webViewLink || f.webContentLink || f.link || '',
        2000
      );
      const name = asString(f.name || f.fileName || f.title || f.filename, 300) || 'piece-jointe';
      const contentType = asString(f.contentType || f.mimeType || f.type, 120);
      return { name, url, contentType, driveFileId };
    })
    .filter((f) => f.name);
}

function snippetFrom(text, html, provided) {
  const fromProvided = asString(provided, 500);
  if (fromProvided) return fromProvided;
  const plain = asString(text, 2000) || asString(html, 2000).replace(/<[^>]+>/g, ' ');
  return plain.replace(/\s+/g, ' ').trim().slice(0, 280);
}

function buildDedupeKey({ gmailMessageId, from, subject, receivedAt }) {
  if (gmailMessageId) return `gmail:${gmailMessageId}`;
  const stamp = receivedAt instanceof Date && !Number.isNaN(receivedAt.getTime())
    ? receivedAt.toISOString()
    : '';
  const raw = `${from}|${subject}|${stamp}`;
  if (!from && !subject && !stamp) return '';
  return `hash:${crypto.createHash('sha256').update(raw).digest('hex').slice(0, 32)}`;
}

function toListItem(doc) {
  const attachments = Array.isArray(doc.attachments) ? doc.attachments : [];
  return {
    id: String(doc._id),
    status: doc.status || 'unread',
    receivedAt: doc.receivedAt,
    from: doc.from || '',
    to: doc.to || '',
    subject: doc.subject || '',
    snippet: doc.snippet || '',
    attachmentCount: attachments.length,
    hasHtml: Boolean(doc.html)
  };
}

function toDetail(doc) {
  return {
    ...toListItem(doc),
    text: doc.text || '',
    html: doc.html || '',
    attachments: (Array.isArray(doc.attachments) ? doc.attachments : []).map((a) => ({
      name: a.name,
      url: a.url || '',
      contentType: a.contentType || '',
      driveFileId: a.driveFileId || ''
    })),
    gmailMessageId: doc.gmailMessageId || '',
    readAt: doc.readAt,
    readByName: doc.readByName || ''
  };
}

/**
 * POST /api/commande-mails/from-n8n
 * n8n Arras — header x-internal-secret = INTERNAL_API_SECRET (api-4)
 *
 * Corps typique :
 * {
 *   "site": "arras",
 *   "gmailMessageId": "{{ $json.id }}",
 *   "from": "{{ $json.from }}",
 *   "to": "{{ $json.to }}",
 *   "subject": "{{ $json.subject }}",
 *   "date": "{{ $json.date }}",
 *   "text": "{{ $json.text }}",
 *   "html": "{{ $json.html }}",
 *   "snippet": "{{ $json.snippet }}",
 *   "attachments": [{ "name": "commande.pdf", "url": "https://..." }]
 * }
 */
async function fromN8n(req, res) {
  try {
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const site = normalizeSite(body.site || 'arras');
    if (site !== 'arras') {
      return res.status(400).json({ success: false, error: ARRAS_ONLY_ERROR });
    }

    const extracted = extractFromPayload(body);
    const gmailMessageId = asString(body.gmailMessageId || body.messageId || body.id, 256);
    const gmailThreadId = asString(body.gmailThreadId || body.threadId, 256);
    const text = asString(
      body.text || body.bodyText || body.plain || body.textPlain || '',
      TEXT_MAX
    );
    const html = asString(
      body.html || body.bodyHtml || body.textHtml || (typeof body.body === 'string' ? body.body : ''),
      HTML_MAX
    );
    const attachments = normalizeAttachments(body.attachments || body.files);
    const receivedAtRaw = extracted.dateRaw;
    const receivedAt = receivedAtRaw ? new Date(receivedAtRaw) : new Date();
    const receivedAtSafe = Number.isNaN(receivedAt.getTime()) ? new Date() : receivedAt;
    const snippet = snippetFrom(text, html, body.snippet || body.preview);

    if (!gmailMessageId && !extracted.subject && !text && !html) {
      return res.status(400).json({
        success: false,
        error: 'Indiquez au moins un sujet, un corps de mail ou un gmailMessageId'
      });
    }

    const dedupeKey = buildDedupeKey({
      gmailMessageId,
      from: extracted.from,
      subject: extracted.subject,
      receivedAt: receivedAtSafe
    });

    const existing = dedupeKey
      ? await CommandeMail.findOne({ site: 'arras', dedupeKey })
      : null;
    if (existing) {
      const $set = {};
      if (!existing.from && extracted.from) $set.from = extracted.from;
      if (!existing.to && extracted.to) $set.to = extracted.to;
      if (!existing.subject && extracted.subject) $set.subject = extracted.subject;
      if (!existing.text && text) $set.text = text;
      if (!existing.html && html) $set.html = html;
      if (!existing.snippet && snippet) $set.snippet = snippet;
      if (attachments.length && (!existing.attachments || existing.attachments.length === 0)) {
        $set.attachments = attachments;
      }
      const updated = Object.keys($set).length
        ? await CommandeMail.findByIdAndUpdate(existing._id, { $set }, { new: true })
        : existing;
      return res.json({
        success: true,
        created: false,
        data: toDetail(updated)
      });
    }

    const doc = await CommandeMail.create({
      site: 'arras',
      status: 'unread',
      receivedAt: receivedAtSafe,
      from: extracted.from,
      to: extracted.to,
      subject: extracted.subject,
      snippet,
      text,
      html,
      attachments,
      gmailMessageId,
      gmailThreadId,
      dedupeKey: dedupeKey || undefined
    });

    console.log('✅ Commande mail Arras enregistrée:', {
      id: String(doc._id),
      subject: extracted.subject,
      from: extracted.from
    });

    return res.status(201).json({
      success: true,
      created: true,
      data: toDetail(doc)
    });
  } catch (err) {
    if (err && err.code === 11000) {
      const gmail = asString(req.body?.gmailMessageId || req.body?.messageId || req.body?.id, 256);
      const existing = gmail
        ? await CommandeMail.findOne({ site: 'arras', gmailMessageId: gmail })
        : null;
      if (existing) {
        return res.json({ success: true, created: false, data: toDetail(existing) });
      }
    }
    console.error('❌ commandeMail fromN8n:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}

async function listMails(req, res) {
  try {
    const site = normalizeSite(req.query.site || 'arras');
    if (site !== 'arras') {
      return res.json({ success: true, data: [] });
    }
    const status = asString(req.query.status, 20);
    const filter = { site: 'arras' };
    if (status === 'unread' || status === 'read') filter.status = status;
    const mails = await CommandeMail.find(filter)
      .select('status receivedAt from to subject snippet attachments html')
      .sort({ receivedAt: -1 })
      .limit(200)
      .lean();
    return res.json({
      success: true,
      data: mails.map(toListItem)
    });
  } catch (err) {
    console.error('❌ commandeMail list:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}

async function getMail(req, res) {
  try {
    const id = String(req.params.id || '').trim();
    if (!id) {
      return res.status(400).json({ success: false, error: 'Identifiant manquant' });
    }
    const doc = await CommandeMail.findOne({ _id: id, site: 'arras' });
    if (!doc) {
      return res.status(404).json({ success: false, error: 'Mail introuvable' });
    }
    if (doc.status !== 'read') {
      doc.status = 'read';
      doc.readAt = new Date();
      doc.readByName = asString(req.user?.name || req.employeeName, 120);
      await doc.save();
    }
    return res.json({ success: true, data: toDetail(doc) });
  } catch (err) {
    console.error('❌ commandeMail get:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}

async function markRead(req, res) {
  try {
    const id = String(req.params.id || '').trim();
    if (!id) {
      return res.status(400).json({ success: false, error: 'Identifiant manquant' });
    }
    const doc = await CommandeMail.findOneAndUpdate(
      { _id: id, site: 'arras' },
      {
        $set: {
          status: 'read',
          readAt: new Date(),
          readByName: asString(req.user?.name || req.employeeName, 120)
        }
      },
      { new: true }
    );
    if (!doc) {
      return res.status(404).json({ success: false, error: 'Mail introuvable' });
    }
    return res.json({ success: true, data: toDetail(doc) });
  } catch (err) {
    console.error('❌ commandeMail markRead:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}

async function removeMail(req, res) {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Réservé à l’administrateur' });
    }
    const id = String(req.params.id || '').trim();
    if (!id) {
      return res.status(400).json({ success: false, error: 'Identifiant manquant' });
    }
    const doc = await CommandeMail.findOneAndDelete({ _id: id, site: 'arras' });
    if (!doc) {
      return res.status(404).json({ success: false, error: 'Mail introuvable' });
    }
    return res.json({ success: true });
  } catch (err) {
    console.error('❌ commandeMail remove:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}

module.exports = {
  fromN8n,
  listMails,
  getMail,
  markRead,
  removeMail
};
