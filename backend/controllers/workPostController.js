const mongoose = require('mongoose');
const Employee = require('../models/Employee');
const WorkPostDay = require('../models/WorkPostDay');
const {
  todayIsoParis,
  workPostRoleId,
  normalizePostes,
  normalizeAnswers,
  dayIssues,
  validationError,
  presentTasks,
  compactSummary
} = require('../utils/workPostFollowup');
const { employeeView, visibleMenus } = require('./workPostCatalogController');

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function isAdmin(req) {
  return req.user?.role === 'admin';
}

function ownEmployeeId(req) {
  const id = req.user?.employeeId || req.user?.id;
  return id && mongoose.Types.ObjectId.isValid(id) ? String(id) : null;
}

async function publicSheet(employee, doc, date, roleId) {
  const view = await employeeView(roleId);
  const phaseIds = new Set(view.phases.map((phase) => phase.id));
  const postes = normalizePostes(doc?.postes || [], phaseIds);
  const answers = doc?.answers || [];
  const issues = dayIssues(postes, answers, view.tasks, phaseIds);
  return {
    success: true,
    eligible: true,
    date,
    roleId: roleId || '',
    employeeName: employee?.name || doc?.employeeName || '',
    postes,
    locked: Boolean(doc?.validatedAt),
    validatedAt: doc?.validatedAt || null,
    menus: view.menus,
    phases: view.phases,
    tasks: presentTasks(answers, view.tasks),
    summary: compactSummary(issues)
  };
}

async function loadVendeuse(req, res) {
  if (isAdmin(req)) {
    res.status(403).json({ success: false, error: 'Cette saisie est réservée aux vendeuses.' });
    return null;
  }
  const employeeId = ownEmployeeId(req);
  const menus = await visibleMenus();
  if (!employeeId) {
    res.json({ success: true, eligible: false, reason: 'account', menus, phases: [], tasks: [] });
    return null;
  }
  const employee = await Employee.findById(employeeId)
    .select('name role employeeCategory isActive')
    .lean();
  if (!employee || employee.isActive === false) {
    res.json({ success: true, eligible: false, reason: 'account', menus, phases: [], tasks: [] });
    return null;
  }
  const roleId = workPostRoleId(employee);
  if (!roleId) {
    res.json({
      success: true,
      eligible: false,
      reason: 'role',
      role: employee.role || '',
      menus,
      phases: [],
      tasks: []
    });
    return null;
  }
  return { employee, employeeId, roleId };
}

async function readToday(employeeId, date) {
  return WorkPostDay.findOne({ employeeId, date });
}

async function writeToday(employee, employeeId, date, postes, answers) {
  const payload = {
    employeeName: employee.name || '',
    employeeRole: employee.role || '',
    postes,
    answers
  };
  return WorkPostDay.findOneAndUpdate(
    { employeeId, date },
    { $set: payload, $setOnInsert: { employeeId, date, validatedAt: null } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}

exports.getToday = async (req, res) => {
  try {
    const loaded = await loadVendeuse(req, res);
    if (!loaded) return;
    const date = todayIsoParis();
    const doc = await readToday(loaded.employeeId, date);
    res.json(await publicSheet(loaded.employee, doc, date, loaded.roleId));
  } catch (error) {
    console.error('work-posts getToday', error);
    res.status(500).json({ success: false, error: 'Impossible de charger le suivi du jour.' });
  }
};

exports.saveToday = async (req, res) => {
  try {
    const loaded = await loadVendeuse(req, res);
    if (!loaded) return;
    const date = todayIsoParis();
    const existing = await readToday(loaded.employeeId, date);
    if (existing?.validatedAt) {
      return res.status(409).json({
        ...(await publicSheet(loaded.employee, existing, date, loaded.roleId)),
        success: false,
        error: 'La journée est déjà validée. Reprenez la checklist pour la modifier.'
      });
    }
    const view = await employeeView(loaded.roleId);
    const phaseIds = new Set(view.phases.map((phase) => phase.id));
    const postes = normalizePostes(req.body?.postes, phaseIds);
    const answers = normalizeAnswers(req.body?.answers, view.tasks);
    const doc = await writeToday(loaded.employee, loaded.employeeId, date, postes, answers);
    res.json(await publicSheet(loaded.employee, doc, date, loaded.roleId));
  } catch (error) {
    console.error('work-posts saveToday', error);
    res.status(500).json({ success: false, error: 'Impossible d’enregistrer le suivi.' });
  }
};

exports.validateToday = async (req, res) => {
  try {
    const loaded = await loadVendeuse(req, res);
    if (!loaded) return;
    const date = todayIsoParis();
    const existing = await readToday(loaded.employeeId, date);
    if (existing?.validatedAt) {
      return res.status(409).json({
        ...(await publicSheet(loaded.employee, existing, date, loaded.roleId)),
        success: false,
        error: 'La journée est déjà validée.'
      });
    }
    const view = await employeeView(loaded.roleId);
    const phaseIds = new Set(view.phases.map((phase) => phase.id));
    const postes = normalizePostes(req.body?.postes, phaseIds);
    const answers = normalizeAnswers(req.body?.answers, view.tasks);
    const issues = dayIssues(postes, answers, view.tasks, phaseIds);
    const doc = await writeToday(loaded.employee, loaded.employeeId, date, postes, answers);
    if (!issues.ok) {
      return res.status(400).json({
        ...(await publicSheet(loaded.employee, doc, date, loaded.roleId)),
        success: false,
        error: validationError(issues, postes, phaseIds)
      });
    }
    doc.validatedAt = new Date();
    await doc.save();
    res.json(await publicSheet(loaded.employee, doc, date, loaded.roleId));
  } catch (error) {
    console.error('work-posts validateToday', error);
    res.status(500).json({ success: false, error: 'Impossible de valider la journée.' });
  }
};

exports.reopenToday = async (req, res) => {
  try {
    const loaded = await loadVendeuse(req, res);
    if (!loaded) return;
    const date = todayIsoParis();
    const doc = await readToday(loaded.employeeId, date);
    if (!doc) {
      return res.status(404).json({ success: false, error: 'Aucune journée à reprendre.' });
    }
    doc.validatedAt = null;
    await doc.save();
    res.json(await publicSheet(loaded.employee, doc, date, loaded.roleId));
  } catch (error) {
    console.error('work-posts reopenToday', error);
    res.status(500).json({ success: false, error: 'Impossible de reprendre la journée.' });
  }
};

exports.listForAdmin = async (req, res) => {
  try {
    if (!isAdmin(req)) {
      return res.status(403).json({ success: false, error: 'Réservé au suivi Filmara.' });
    }
    const date = DATE_RE.test(req.query.date) ? req.query.date : todayIsoParis();
    const view = await employeeView('');
    const phaseIds = new Set(view.phases.map((phase) => phase.id));
    const docs = await WorkPostDay.find({ date }).sort({ employeeName: 1, createdAt: 1 }).lean();
    const sheets = docs.map((doc) => {
      const postes = normalizePostes(doc.postes, phaseIds);
      const issues = dayIssues(postes, doc.answers || [], view.tasks, phaseIds);
      const tasks = presentTasks(doc.answers, view.tasks).filter((task) => postes.includes(task.phase));
      return {
        id: String(doc._id),
        employeeId: String(doc.employeeId),
        employeeName: doc.employeeName || 'Vendeuse',
        employeeRole: doc.employeeRole || '',
        postes,
        locked: Boolean(doc.validatedAt),
        validatedAt: doc.validatedAt || null,
        updatedAt: doc.updatedAt || null,
        tasks,
        summary: compactSummary(issues)
      };
    });
    res.json({ success: true, date, phases: view.phases, sheets });
  } catch (error) {
    console.error('work-posts listForAdmin', error);
    res.status(500).json({ success: false, error: 'Impossible de charger le suivi des postes.' });
  }
};
