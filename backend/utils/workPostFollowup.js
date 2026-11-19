const { PHASES, TASKS, PHASE_IDS } = require('../constants/vendeuseWorkPosts');

const VENDEUSE_ROLES = new Set(['vendeuse', 'Apprenti Vendeuse']);

function todayIsoParis(dateInput = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Paris',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(dateInput);
}

function isVendeuseEmployee(employee) {
  if (!employee || employee.isActive === false) return false;
  if (VENDEUSE_ROLES.has(employee.role)) return true;
  if (employee.role === 'apprenti') {
    return (employee.employeeCategory || 'vente') === 'vente';
  }
  return false;
}

function workPostRoleId(employee) {
  if (!employee || employee.isActive === false) return '';
  if (isVendeuseEmployee(employee)) return 'vente';
  const role = String(employee.role || '').toLowerCase();
  const category = String(employee.employeeCategory || '').toLowerCase();
  if (category === 'boulanger' || role.includes('boulanger')) return 'boulanger';
  if (
    category === 'preparation'
    || role.includes('préparateur')
    || role.includes('preparateur')
    || role === 'chef prod'
  ) {
    return 'preparateur';
  }
  return '';
}

function phaseLabel(phaseId, phases = PHASES) {
  return (phases || PHASES).find((phase) => phase.id === phaseId)?.label || phaseId;
}

function allowedPhaseIds(allowedIds) {
  if (allowedIds instanceof Set) return allowedIds;
  if (Array.isArray(allowedIds)) return new Set(allowedIds);
  return PHASE_IDS;
}

function taskSource(tasks) {
  return Array.isArray(tasks) ? tasks : TASKS;
}

function normalizePostes(rawPostes, allowedIds = PHASE_IDS) {
  const allowed = allowedPhaseIds(allowedIds);
  const postes = [];
  for (const value of Array.isArray(rawPostes) ? rawPostes : []) {
    const id = String(value || '');
    if (allowed.has(id) && !postes.includes(id)) postes.push(id);
  }
  return postes;
}

function normalizeAnswers(rawAnswers, tasks = TASKS) {
  const byId = new Map(taskSource(tasks).map((task) => [task.id, task]));
  const answers = [];
  const seen = new Set();
  for (const raw of Array.isArray(rawAnswers) ? rawAnswers : []) {
    const taskId = String(raw?.taskId || raw?.id || '');
    const task = byId.get(taskId);
    if (!task || seen.has(taskId)) continue;
    seen.add(taskId);
    let status = raw?.status;
    if (status !== 'done' && status !== 'not_done' && status !== 'skipped') status = 'pending';
    if (status === 'skipped' && !task.weekly) status = 'pending';
    const reason = status === 'not_done' || status === 'skipped'
      ? String(raw?.reason || '').trim().slice(0, 500)
      : '';
    answers.push({ taskId, status, reason });
  }
  return answers;
}

function dayIssues(postes, answers, tasks = TASKS, allowedIds) {
  const source = taskSource(tasks);
  const ids = allowedIds ? allowedPhaseIds(allowedIds) : new Set(source.map((task) => task.phase));
  const selected = new Set(normalizePostes(postes, ids));
  const byId = new Map(normalizeAnswers(answers, source).map((answer) => [answer.taskId, answer]));
  const pending = [];
  const missingReason = [];
  const notDone = [];
  const skipped = [];
  let done = 0;
  const required = source.filter((task) => selected.has(task.phase));

  for (const task of required) {
    const answer = byId.get(task.id);
    const status = answer?.status || 'pending';
    if (status === 'done') {
      done += 1;
    } else if (status === 'skipped') {
      skipped.push({ id: task.id, label: task.label, reason: answer.reason || '' });
      if (!String(answer.reason || '').trim()) missingReason.push({ id: task.id, label: task.label });
    } else if (status === 'not_done') {
      notDone.push({ id: task.id, label: task.label, reason: answer.reason || '' });
      if (!String(answer.reason || '').trim()) missingReason.push({ id: task.id, label: task.label });
    } else {
      pending.push({ id: task.id, label: task.label });
    }
  }

  const ok = selected.size > 0 && pending.length === 0 && missingReason.length === 0;
  return {
    ok,
    done,
    required: required.length,
    pending,
    missingReason,
    notDone,
    skipped
  };
}

function validationError(issues, postes, allowedIds = PHASE_IDS) {
  if (!normalizePostes(postes, allowedIds).length) {
    return 'Choisissez au moins un poste avant de valider la journée.';
  }
  if (issues.pending.length) {
    return 'Il reste des tâches à cocher sur vos postes.';
  }
  if (issues.missingReason.length) {
    return 'Indiquez la raison de chaque tâche non faite.';
  }
  return '';
}

function presentTasks(answers, tasks = TASKS) {
  const source = taskSource(tasks);
  const byId = new Map(normalizeAnswers(answers, source).map((answer) => [answer.taskId, answer]));
  return source.map((task) => {
    const answer = byId.get(task.id);
    return {
      id: task.id,
      phase: task.phase,
      label: task.label,
      detail: task.detail || '',
      group: task.group || '',
      groupLabel: task.groupLabel || '',
      weekly: !!task.weekly,
      status: answer?.status || 'pending',
      reason: answer?.reason || ''
    };
  });
}

function compactSummary(issues) {
  return {
    ok: issues.ok,
    done: issues.done,
    pending: issues.pending.length,
    notDone: issues.notDone.length,
    skipped: issues.skipped.length,
    required: issues.required,
    pendingIds: issues.pending.map((task) => task.id),
    missingReasonIds: issues.missingReason.map((task) => task.id),
    notDoneItems: issues.notDone,
    skippedItems: issues.skipped
  };
}

module.exports = {
  PHASES,
  todayIsoParis,
  isVendeuseEmployee,
  workPostRoleId,
  phaseLabel,
  normalizePostes,
  normalizeAnswers,
  dayIssues,
  validationError,
  presentTasks,
  compactSummary
};
