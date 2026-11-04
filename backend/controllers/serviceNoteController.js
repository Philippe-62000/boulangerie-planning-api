const mongoose = require('mongoose');
const Employee = require('../models/Employee');
const ServiceNote = require('../models/ServiceNote');
const {
  AUDIENCES,
  normalizeAudience,
  audienceLabel,
  buildRecipients,
  recipientStats,
  defaultTitle
} = require('../utils/serviceNotes');

function isAdminUser(req) {
  return req.user?.role === 'admin';
}

function requireAdmin(req, res) {
  if (!isAdminUser(req)) {
    res.status(403).json({ success: false, error: 'Accès réservé aux administrateurs' });
    return false;
  }
  return true;
}

function currentEmployeeId(req) {
  const value = req.user?.employeeId || req.employeeId || null;
  if (!value || !mongoose.Types.ObjectId.isValid(value)) return null;
  return value;
}

function publicRecipient(item, { includeSignature = false } = {}) {
  const row = {
    employeeId: String(item.employeeId),
    employeeName: item.employeeName,
    assignedAt: item.assignedAt,
    viewedAt: item.viewedAt || null,
    signedAt: item.signedAt || null,
    hasSignature: !!(item.signatureDataUrl && item.signedAt)
  };
  if (includeSignature) row.signatureDataUrl = item.signatureDataUrl || '';
  return row;
}

function serializeNote(note, { includeSignatures = false } = {}) {
  const recipients = note.recipients || [];
  return {
    id: String(note._id),
    title: note.title,
    content: note.content,
    audience: note.audience,
    audienceLabel: audienceLabel(note.audience),
    createdAt: note.createdAt,
    createdBy: note.createdBy || '',
    ...recipientStats(recipients),
    recipients: recipients
      .slice()
      .sort((a, b) => String(a.employeeName || '').localeCompare(String(b.employeeName || ''), 'fr'))
      .map((item) => publicRecipient(item, { includeSignature: includeSignatures }))
  };
}

function serializeMine(note, employeeId) {
  const recipient = (note.recipients || []).find((item) => String(item.employeeId) === String(employeeId));
  return {
    id: String(note._id),
    title: note.title,
    content: note.content,
    audienceLabel: audienceLabel(note.audience),
    createdAt: note.createdAt,
    createdBy: note.createdBy || '',
    viewedAt: recipient?.viewedAt || null,
    signedAt: recipient?.signedAt || null
  };
}

async function loadActiveEmployees() {
  return Employee.find({ isActive: true })
    .select('name employeeCategory isActive')
    .sort({ name: 1 })
    .lean();
}

const listAudiences = (req, res) => {
  res.json({ success: true, audiences: AUDIENCES });
};

const createNote = async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;
    const content = String(req.body?.content || '').trim();
    if (!content) {
      return res.status(400).json({ success: false, error: 'Saisissez le contenu de la note' });
    }
    const audience = normalizeAudience(req.body?.audience);
    const title = String(req.body?.title || '').trim() || defaultTitle(content);
    const employees = await loadActiveEmployees();
    const recipients = buildRecipients(employees, audience);
    if (!recipients.length) {
      return res.status(400).json({
        success: false,
        error: 'Aucun salarié actif pour ce destinataire'
      });
    }
    const note = await ServiceNote.create({
      title,
      content,
      audience,
      createdBy: req.user?.name || req.user?.email || 'Administrateur',
      recipients
    });
    res.status(201).json({
      success: true,
      message: `Note envoyée à ${recipients.length} salarié(s)`,
      note: serializeNote(note)
    });
  } catch (error) {
    console.error('service-notes create', error);
    res.status(500).json({ success: false, error: 'Impossible d’enregistrer la note' });
  }
};

const listNotes = async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;
    const notes = await ServiceNote.find({}).sort({ createdAt: -1 }).lean();
    res.json({
      success: true,
      notes: notes.map((note) => serializeNote(note))
    });
  } catch (error) {
    console.error('service-notes list', error);
    res.status(500).json({ success: false, error: 'Impossible de charger les notes' });
  }
};

const getNote = async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;
    const note = await ServiceNote.findById(req.params.id);
    if (!note) {
      return res.status(404).json({ success: false, error: 'Note introuvable' });
    }
    res.json({ success: true, note: serializeNote(note, { includeSignatures: true }) });
  } catch (error) {
    console.error('service-notes get', error);
    res.status(500).json({ success: false, error: 'Impossible de charger la note' });
  }
};

const deleteNote = async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;
    const note = await ServiceNote.findByIdAndDelete(req.params.id);
    if (!note) {
      return res.status(404).json({ success: false, error: 'Note introuvable' });
    }
    res.json({ success: true, message: 'Note supprimée' });
  } catch (error) {
    console.error('service-notes delete', error);
    res.status(500).json({ success: false, error: 'Impossible de supprimer la note' });
  }
};

async function addEmployeesToNote(note, employeeIds) {
  const ids = [...new Set((employeeIds || []).map(String).filter(Boolean))];
  if (!ids.length) return { added: 0, skipped: 0 };
  const existing = new Set((note.recipients || []).map((item) => String(item.employeeId)));
  const employees = await Employee.find({ _id: { $in: ids }, isActive: true })
    .select('name')
    .lean();
  const now = new Date();
  let added = 0;
  employees.forEach((employee) => {
    const id = String(employee._id);
    if (existing.has(id)) return;
    note.recipients.push({
      employeeId: employee._id,
      employeeName: employee.name || '',
      assignedAt: now
    });
    existing.add(id);
    added += 1;
  });
  if (added) await note.save();
  return { added, skipped: ids.length - added };
}

const assignToNote = async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;
    const note = await ServiceNote.findById(req.params.id);
    if (!note) {
      return res.status(404).json({ success: false, error: 'Note introuvable' });
    }
    const result = await addEmployeesToNote(note, req.body?.employeeIds || []);
    res.json({
      success: true,
      message: result.added
        ? `${result.added} salarié(s) ajouté(s)`
        : 'Aucun nouveau destinataire',
      note: serializeNote(note)
    });
  } catch (error) {
    console.error('service-notes assign', error);
    res.status(500).json({ success: false, error: 'Impossible d’attribuer la note' });
  }
};

const assignEmployeeNotes = async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;
    const employeeId = req.body?.employeeId;
    const noteIds = req.body?.noteIds || [];
    if (!employeeId) {
      return res.status(400).json({ success: false, error: 'Salarié requis' });
    }
    const employee = await Employee.findById(employeeId).select('name isActive').lean();
    if (!employee || employee.isActive === false) {
      return res.status(404).json({ success: false, error: 'Salarié introuvable ou inactif' });
    }
    const notes = await ServiceNote.find({ _id: { $in: noteIds } });
    let added = 0;
    for (const note of notes) {
      const result = await addEmployeesToNote(note, [employeeId]);
      added += result.added;
    }
    res.json({
      success: true,
      message: added
        ? `${added} note(s) attribuée(s) à ${employee.name}`
        : `Aucune nouvelle note pour ${employee.name}`
    });
  } catch (error) {
    console.error('service-notes assign-employee', error);
    res.status(500).json({ success: false, error: 'Impossible d’attribuer les notes' });
  }
};

const listMine = async (req, res) => {
  try {
    const employeeId = currentEmployeeId(req);
    if (!employeeId || isAdminUser(req)) {
      return res.json({ success: true, notes: [] });
    }
    const notes = await ServiceNote.find({ 'recipients.employeeId': employeeId })
      .sort({ createdAt: -1 })
      .lean();
    res.json({
      success: true,
      notes: notes.map((note) => serializeMine(note, employeeId))
    });
  } catch (error) {
    console.error('service-notes mine', error);
    res.status(500).json({ success: false, error: 'Impossible de charger vos notes' });
  }
};

const listPending = async (req, res) => {
  try {
    const employeeId = currentEmployeeId(req);
    if (!employeeId || isAdminUser(req)) {
      return res.json({ success: true, notes: [] });
    }
    const notes = await ServiceNote.find({
      recipients: { $elemMatch: { employeeId, signedAt: null } }
    }).sort({ createdAt: 1 }).lean();
    res.json({
      success: true,
      notes: notes.map((note) => serializeMine(note, employeeId))
    });
  } catch (error) {
    console.error('service-notes pending', error);
    res.status(500).json({ success: false, error: 'Impossible de charger les notes à signer' });
  }
};

function findRecipient(note, employeeId) {
  return (note.recipients || []).find((item) => String(item.employeeId) === String(employeeId));
}

const markViewed = async (req, res) => {
  try {
    const employeeId = currentEmployeeId(req);
    if (!employeeId || isAdminUser(req)) {
      return res.status(403).json({ success: false, error: 'Connexion salarié requise' });
    }
    const note = await ServiceNote.findById(req.params.id);
    if (!note) {
      return res.status(404).json({ success: false, error: 'Note introuvable' });
    }
    const recipient = findRecipient(note, employeeId);
    if (!recipient) {
      return res.status(403).json({ success: false, error: 'Cette note ne vous est pas destinée' });
    }
    if (!recipient.viewedAt) {
      recipient.viewedAt = new Date();
      note.markModified('recipients');
      await note.save();
    }
    res.json({ success: true, note: serializeMine(note.toObject(), employeeId) });
  } catch (error) {
    console.error('service-notes viewed', error);
    res.status(500).json({ success: false, error: 'Impossible d’enregistrer la lecture' });
  }
};

const signNote = async (req, res) => {
  try {
    const employeeId = currentEmployeeId(req);
    if (!employeeId || isAdminUser(req)) {
      return res.status(403).json({ success: false, error: 'Connexion salarié requise' });
    }
    const signatureDataUrl = String(req.body?.signatureDataUrl || '');
    if (!signatureDataUrl.startsWith('data:image/')) {
      return res.status(400).json({ success: false, error: 'Signature requise' });
    }
    const note = await ServiceNote.findById(req.params.id);
    if (!note) {
      return res.status(404).json({ success: false, error: 'Note introuvable' });
    }
    const recipient = findRecipient(note, employeeId);
    if (!recipient) {
      return res.status(403).json({ success: false, error: 'Cette note ne vous est pas destinée' });
    }
    if (recipient.signedAt) {
      return res.json({ success: true, note: serializeMine(note.toObject(), employeeId) });
    }
    recipient.viewedAt = recipient.viewedAt || new Date();
    recipient.signedAt = new Date();
    recipient.signatureDataUrl = signatureDataUrl;
    note.markModified('recipients');
    await note.save();
    res.json({ success: true, note: serializeMine(note.toObject(), employeeId) });
  } catch (error) {
    console.error('service-notes sign', error);
    res.status(500).json({ success: false, error: 'Impossible d’enregistrer la signature' });
  }
};

module.exports = {
  listAudiences,
  createNote,
  listNotes,
  getNote,
  deleteNote,
  assignToNote,
  assignEmployeeNotes,
  listMine,
  listPending,
  markViewed,
  signNote
};
