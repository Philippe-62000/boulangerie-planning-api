const mongoose = require('mongoose');
const PlanningImperative = require('../models/PlanningImperative');
const Employee = require('../models/Employee');

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

function todayIsoParis(dateInput = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Paris',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(dateInput);
}

function addDaysIso(isoDate, days) {
  const [year, month, day] = String(isoDate).split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days));
  return date.toISOString().slice(0, 10);
}

function normalizeTime(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  const match = raw.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return '';
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return '';
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

function timeToMinutes(value) {
  const normalized = normalizeTime(value);
  if (!TIME_RE.test(normalized)) return null;
  const [hours, minutes] = normalized.split(':').map(Number);
  return hours * 60 + minutes;
}

function isAdmin(req) {
  return req.user?.role === 'admin';
}

function ownEmployeeId(req) {
  const id = req.user?.employeeId || req.user?.id;
  return id && mongoose.Types.ObjectId.isValid(id) ? String(id) : null;
}

function publicItem(item) {
  if (!item) return null;
  return {
    id: String(item._id),
    employeeId: String(item.employeeId),
    employeeName: item.employeeName || '',
    date: item.date,
    kind: item.kind,
    startTime: item.startTime || '',
    endTime: item.endTime || '',
    comment: item.comment || '',
    status: item.status,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt
  };
}

async function resolveEmployee(req) {
  if (isAdmin(req)) {
    return { error: 'Cette saisie est réservée aux salariés' };
  }
  const employeeId = ownEmployeeId(req);
  if (!employeeId) {
    return { error: 'Compte salarié introuvable', status: 403 };
  }
  const employee = await Employee.findById(employeeId).select('name email isActive').lean();
  if (!employee || employee.isActive === false) {
    return { error: 'Compte salarié introuvable', status: 403 };
  }
  return { employee, employeeId };
}

exports.listPlanningImperatives = async (req, res) => {
  try {
    const today = todayIsoParis();
    const from = DATE_RE.test(req.query.from) ? req.query.from : addDaysIso(today, -14);
    const to = DATE_RE.test(req.query.to) ? req.query.to : addDaysIso(today, 120);
    const filter = {
      date: { $gte: from, $lte: to },
      status: req.query.status === 'all' ? { $in: ['active', 'cancelled'] } : 'active'
    };

    if (!isAdmin(req)) {
      const employeeId = ownEmployeeId(req);
      if (!employeeId) {
        return res.status(403).json({ success: false, error: 'Compte salarié introuvable' });
      }
      filter.employeeId = employeeId;
    } else if (req.query.employeeId && mongoose.Types.ObjectId.isValid(req.query.employeeId)) {
      filter.employeeId = req.query.employeeId;
    }

    const items = await PlanningImperative.find(filter).sort({ date: 1, startTime: 1, createdAt: 1 }).lean();
    res.json({ success: true, data: items.map(publicItem) });
  } catch (error) {
    console.error('planning-imperatives GET', error);
    res.status(500).json({ success: false, error: 'Impossible de charger les impératifs de planning' });
  }
};

exports.createPlanningImperative = async (req, res) => {
  try {
    const resolved = await resolveEmployee(req);
    if (resolved.error) {
      return res.status(resolved.status || 403).json({ success: false, error: resolved.error });
    }

    const date = String(req.body?.date || '').trim();
    if (!DATE_RE.test(date)) {
      return res.status(400).json({ success: false, error: 'Date invalide' });
    }
    const today = todayIsoParis();
    if (date < today) {
      return res.status(400).json({ success: false, error: 'Choisissez une date à partir d’aujourd’hui' });
    }
    if (date > addDaysIso(today, 366)) {
      return res.status(400).json({ success: false, error: 'La date est trop éloignée' });
    }

    const kind = req.body?.kind === 'unavailable' ? 'unavailable' : (req.body?.kind === 'rest' ? 'rest' : '');
    if (!kind) {
      return res.status(400).json({ success: false, error: 'Indiquez une journée de repos ou une plage d’indisponibilité' });
    }

    const startTime = kind === 'unavailable' ? normalizeTime(req.body?.startTime) : '';
    const endTime = kind === 'unavailable' ? normalizeTime(req.body?.endTime) : '';
    if (kind === 'unavailable') {
      const startMins = timeToMinutes(startTime);
      const endMins = timeToMinutes(endTime);
      if (startMins == null || endMins == null) {
        return res.status(400).json({ success: false, error: 'Indiquez l’heure de début et l’heure de fin' });
      }
      if (endMins <= startMins) {
        return res.status(400).json({ success: false, error: 'L’heure de fin doit être après l’heure de début' });
      }
    }

    const comment = String(req.body?.comment || '').trim().slice(0, 500);
    const payload = {
      employeeId: resolved.employeeId,
      employeeName: resolved.employee.name || req.user?.name || '',
      date,
      kind,
      startTime,
      endTime,
      comment,
      status: 'active'
    };

    const existing = await PlanningImperative.findOne({
      employeeId: resolved.employeeId,
      date,
      status: 'active'
    });
    let saved;
    if (existing) {
      Object.assign(existing, payload);
      saved = await existing.save();
    } else {
      saved = await PlanningImperative.create(payload);
    }

    res.status(existing ? 200 : 201).json({
      success: true,
      data: publicItem(saved),
      updated: !!existing
    });
  } catch (error) {
    console.error('planning-imperatives POST', error);
    res.status(500).json({ success: false, error: 'Impossible d’enregistrer l’impératif de planning' });
  }
};

exports.cancelPlanningImperative = async (req, res) => {
  try {
    const id = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: 'Identifiant invalide' });
    }
    const item = await PlanningImperative.findById(id);
    if (!item || item.status !== 'active') {
      return res.status(404).json({ success: false, error: 'Impératif introuvable' });
    }
    if (!isAdmin(req)) {
      const employeeId = ownEmployeeId(req);
      if (!employeeId || String(item.employeeId) !== employeeId) {
        return res.status(403).json({ success: false, error: 'Action non autorisée' });
      }
      if (item.date < todayIsoParis()) {
        return res.status(400).json({ success: false, error: 'Impossible d’annuler un impératif passé' });
      }
    }
    item.status = 'cancelled';
    await item.save();
    res.json({ success: true, data: publicItem(item) });
  } catch (error) {
    console.error('planning-imperatives DELETE', error);
    res.status(500).json({ success: false, error: 'Impossible d’annuler cet impératif' });
  }
};
