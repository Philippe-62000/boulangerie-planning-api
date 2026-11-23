const mongoose = require('mongoose');
const Employee = require('../models/Employee');
const WorkMission = require('../models/WorkMission');
const { todayIsoParis } = require('../utils/workPostFollowup');
const {
  cleanLine,
  cleanBlock,
  isIsoDate,
  normalizeEmployeeStatus,
  normalizeSupervisorStatus,
  presentMission
} = require('../utils/workMission');

function isAdmin(req) {
  return req.user?.role === 'admin';
}

function ownEmployeeId(req) {
  const id = req.user?.employeeId || req.user?.id;
  return id && mongoose.Types.ObjectId.isValid(id) ? String(id) : null;
}

function actorName(req) {
  const name = cleanLine(req.user?.name || req.employeeName || '', 120);
  if (name) return name;
  return isAdmin(req) ? 'Administrateur' : 'Salarié';
}

async function linkedEmployee(req) {
  if (isAdmin(req)) return null;
  const employeeId = ownEmployeeId(req);
  if (!employeeId) return null;
  const employee = await Employee.findById(employeeId).select('name isActive').lean();
  if (!employee || employee.isActive === false) return null;
  return { employee, employeeId };
}

async function findMission(id) {
  if (!mongoose.Types.ObjectId.isValid(id)) return null;
  return WorkMission.findById(id);
}

exports.listToday = async (req, res) => {
  try {
    const date = todayIsoParis();
    const linked = await linkedEmployee(req);
    if (!linked) {
      return res.json({ success: true, linked: false, date, missions: [] });
    }
    const docs = await WorkMission.find({ employeeId: linked.employeeId, date })
      .sort({ createdAt: 1 })
      .lean();
    res.json({
      success: true,
      linked: true,
      date,
      employeeName: linked.employee.name || '',
      missions: docs.map(presentMission)
    });
  } catch (error) {
    console.error('work-missions listToday', error);
    res.status(500).json({ success: false, error: 'Impossible de charger vos missions.' });
  }
};

exports.report = async (req, res) => {
  try {
    const linked = await linkedEmployee(req);
    if (!linked) {
      return res.status(403).json({
        success: false,
        error: 'Connectez-vous avec votre compte salarié pour noter une mission.'
      });
    }
    const status = normalizeEmployeeStatus(req.body?.status);
    if (!status) {
      return res.status(400).json({
        success: false,
        error: 'Indiquez si la mission est réalisée ou non.'
      });
    }
    const doc = await findMission(req.params.id);
    if (!doc) {
      return res.status(404).json({ success: false, error: 'Mission introuvable.' });
    }
    if (String(doc.employeeId) !== linked.employeeId) {
      return res.status(403).json({ success: false, error: 'Cette mission est attribuée à un autre salarié.' });
    }
    if (doc.date !== todayIsoParis()) {
      return res.status(403).json({
        success: false,
        error: 'Une mission se note le jour où elle est prévue.'
      });
    }
    doc.employeeStatus = status;
    doc.employeeNote = status === 'done' ? '' : cleanBlock(req.body?.note, 500);
    doc.employeeUpdatedAt = new Date();
    await doc.save();
    res.json({ success: true, mission: presentMission(doc) });
  } catch (error) {
    console.error('work-missions report', error);
    res.status(500).json({ success: false, error: 'Impossible d’enregistrer la mission.' });
  }
};

exports.listEmployees = async (req, res) => {
  try {
    const employees = await Employee.find({ isActive: { $ne: false } })
      .select('name role')
      .sort({ name: 1 })
      .lean();
    res.json({
      success: true,
      employees: employees.map((employee) => ({
        id: String(employee._id),
        name: employee.name || 'Salarié',
        role: employee.role || ''
      }))
    });
  } catch (error) {
    console.error('work-missions listEmployees', error);
    res.status(500).json({ success: false, error: 'Impossible de charger les salariés.' });
  }
};

exports.create = async (req, res) => {
  try {
    const title = cleanLine(req.body?.title, 300);
    const detail = cleanBlock(req.body?.detail, 1000);
    const date = String(req.body?.date || '');
    const employeeId = String(req.body?.employeeId || '');
    if (!title) {
      return res.status(400).json({ success: false, error: 'Indiquez la tâche à attribuer.' });
    }
    if (!isIsoDate(date)) {
      return res.status(400).json({ success: false, error: 'Choisissez le jour d’exécution.' });
    }
    if (!mongoose.Types.ObjectId.isValid(employeeId)) {
      return res.status(400).json({ success: false, error: 'Choisissez un salarié.' });
    }
    const employee = await Employee.findById(employeeId).select('name isActive').lean();
    if (!employee || employee.isActive === false) {
      return res.status(404).json({ success: false, error: 'Salarié introuvable.' });
    }
    const doc = await WorkMission.create({
      employeeId,
      employeeName: employee.name || '',
      title,
      detail,
      date,
      createdByName: actorName(req)
    });
    res.status(201).json({ success: true, mission: presentMission(doc) });
  } catch (error) {
    console.error('work-missions create', error);
    res.status(500).json({ success: false, error: 'Impossible d’attribuer la tâche.' });
  }
};

exports.list = async (req, res) => {
  try {
    const employeeId = String(req.query.employeeId || '');
    const hasEmployee = mongoose.Types.ObjectId.isValid(employeeId);
    const allForEmployee = req.query.scope === 'employee' && hasEmployee;
    const date = isIsoDate(req.query.date) ? req.query.date : todayIsoParis();
    const filter = {};
    if (allForEmployee) {
      filter.employeeId = employeeId;
    } else {
      filter.date = date;
      if (hasEmployee) filter.employeeId = employeeId;
    }
    const docs = await WorkMission.find(filter)
      .sort(allForEmployee ? { date: -1, createdAt: 1 } : { employeeName: 1, createdAt: 1 })
      .lean();
    res.json({
      success: true,
      date,
      scope: allForEmployee ? 'employee' : 'day',
      employeeId: hasEmployee ? employeeId : '',
      missions: docs.map(presentMission)
    });
  } catch (error) {
    console.error('work-missions list', error);
    res.status(500).json({ success: false, error: 'Impossible de charger le suivi des tâches.' });
  }
};

exports.supervise = async (req, res) => {
  try {
    const supervisorStatus = normalizeSupervisorStatus(req.body?.supervisorStatus);
    if (supervisorStatus === null) {
      return res.status(400).json({
        success: false,
        error: 'Indiquez non réalisée, incomplète, ou retirez la supervision.'
      });
    }
    const doc = await findMission(req.params.id);
    if (!doc) {
      return res.status(404).json({ success: false, error: 'Mission introuvable.' });
    }
    doc.supervisorStatus = supervisorStatus;
    doc.supervisorNote = supervisorStatus ? cleanBlock(req.body?.note, 500) : '';
    doc.supervisedAt = supervisorStatus ? new Date() : null;
    await doc.save();
    res.json({ success: true, mission: presentMission(doc) });
  } catch (error) {
    console.error('work-missions supervise', error);
    res.status(500).json({ success: false, error: 'Impossible d’enregistrer la supervision.' });
  }
};

exports.remove = async (req, res) => {
  try {
    const doc = await findMission(req.params.id);
    if (!doc) {
      return res.status(404).json({ success: false, error: 'Mission introuvable.' });
    }
    await doc.deleteOne();
    res.json({ success: true });
  } catch (error) {
    console.error('work-missions remove', error);
    res.status(500).json({ success: false, error: 'Impossible de retirer la tâche.' });
  }
};
