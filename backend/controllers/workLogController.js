const mongoose = require('mongoose');
const Employee = require('../models/Employee');
const WorkLog = require('../models/WorkLog');
const { todayIsoParis } = require('../utils/workPostFollowup');
const { isIsoDate } = require('../utils/workMission');
const { normalizeQuantity, normalizeLabel, presentLog } = require('../utils/workLog');

function isAdmin(req) {
  return req.user?.role === 'admin';
}

function ownEmployeeId(req) {
  const id = req.user?.employeeId || req.user?.id;
  return id && mongoose.Types.ObjectId.isValid(id) ? String(id) : null;
}

async function linkedEmployee(req) {
  if (isAdmin(req)) return null;
  const employeeId = ownEmployeeId(req);
  if (!employeeId) return null;
  const employee = await Employee.findById(employeeId).select('name isActive').lean();
  if (!employee || employee.isActive === false) return null;
  return { employee, employeeId };
}

async function findOwnLog(req, id) {
  const linked = await linkedEmployee(req);
  if (!linked) return { error: 403, message: 'Connectez-vous avec votre compte salarié pour noter votre travail.' };
  if (!mongoose.Types.ObjectId.isValid(id)) return { error: 404, message: 'Ligne introuvable.' };
  const doc = await WorkLog.findById(id);
  if (!doc) return { error: 404, message: 'Ligne introuvable.' };
  if (String(doc.employeeId) !== linked.employeeId) {
    return { error: 403, message: 'Cette ligne appartient à un autre salarié.' };
  }
  return { doc };
}

function readFields(body) {
  const label = normalizeLabel(body?.label);
  const quantity = normalizeQuantity(body?.quantity);
  if (!label) return { error: 'Indiquez ce que vous avez fait.' };
  if (quantity == null) return { error: 'Indiquez une quantité supérieure à zéro.' };
  return { label, quantity };
}

exports.listToday = async (req, res) => {
  try {
    const date = todayIsoParis();
    const linked = await linkedEmployee(req);
    if (!linked) {
      return res.json({ success: true, linked: false, date, logs: [] });
    }
    const docs = await WorkLog.find({ employeeId: linked.employeeId, date })
      .sort({ createdAt: 1 })
      .lean();
    res.json({
      success: true,
      linked: true,
      date,
      employeeName: linked.employee.name || '',
      logs: docs.map(presentLog)
    });
  } catch (error) {
    console.error('work-logs listToday', error);
    res.status(500).json({ success: false, error: 'Impossible de charger votre travail.' });
  }
};

exports.create = async (req, res) => {
  try {
    const linked = await linkedEmployee(req);
    if (!linked) {
      return res.status(403).json({
        success: false,
        error: 'Connectez-vous avec votre compte salarié pour noter votre travail.'
      });
    }
    const fields = readFields(req.body);
    if (fields.error) return res.status(400).json({ success: false, error: fields.error });
    const doc = await WorkLog.create({
      employeeId: linked.employeeId,
      employeeName: linked.employee.name || '',
      date: todayIsoParis(),
      label: fields.label,
      quantity: fields.quantity
    });
    res.status(201).json({ success: true, log: presentLog(doc) });
  } catch (error) {
    console.error('work-logs create', error);
    res.status(500).json({ success: false, error: 'Impossible d’enregistrer cette ligne.' });
  }
};

exports.update = async (req, res) => {
  try {
    const found = await findOwnLog(req, req.params.id);
    if (found.error) return res.status(found.error).json({ success: false, error: found.message });
    const fields = readFields(req.body);
    if (fields.error) return res.status(400).json({ success: false, error: fields.error });
    found.doc.label = fields.label;
    found.doc.quantity = fields.quantity;
    await found.doc.save();
    res.json({ success: true, log: presentLog(found.doc) });
  } catch (error) {
    console.error('work-logs update', error);
    res.status(500).json({ success: false, error: 'Impossible de modifier cette ligne.' });
  }
};

exports.remove = async (req, res) => {
  try {
    const found = await findOwnLog(req, req.params.id);
    if (found.error) return res.status(found.error).json({ success: false, error: found.message });
    await found.doc.deleteOne();
    res.json({ success: true });
  } catch (error) {
    console.error('work-logs remove', error);
    res.status(500).json({ success: false, error: 'Impossible de supprimer cette ligne.' });
  }
};

exports.list = async (req, res) => {
  try {
    const employeeId = String(req.query.employeeId || '');
    const hasEmployee = mongoose.Types.ObjectId.isValid(employeeId);
    const allForEmployee = req.query.scope === 'employee' && hasEmployee;
    const date = isIsoDate(req.query.date) ? req.query.date : todayIsoParis();
    const filter = {};
    if (allForEmployee) filter.employeeId = employeeId;
    else {
      filter.date = date;
      if (hasEmployee) filter.employeeId = employeeId;
    }
    const docs = await WorkLog.find(filter)
      .sort(allForEmployee ? { date: -1, createdAt: 1 } : { employeeName: 1, createdAt: 1 })
      .lean();
    res.json({
      success: true,
      date,
      scope: allForEmployee ? 'employee' : 'day',
      employeeId: hasEmployee ? employeeId : '',
      logs: docs.map(presentLog)
    });
  } catch (error) {
    console.error('work-logs list', error);
    res.status(500).json({ success: false, error: 'Impossible de charger le suivi du travail.' });
  }
};
