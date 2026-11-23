const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const EMPLOYEE_STATUSES = new Set(['pending', 'done', 'not_done']);
const SUPERVISOR_STATUSES = new Set(['', 'not_done', 'incomplete']);

function cleanLine(value, max) {
  return String(value || '').replace(/\s+/g, ' ').trim().slice(0, max);
}

function cleanBlock(value, max) {
  return String(value || '').replace(/\r\n/g, '\n').trim().slice(0, max);
}

function isIsoDate(value) {
  if (!DATE_RE.test(String(value || ''))) return false;
  const [year, month, day] = String(value).split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year
    && date.getUTCMonth() === month - 1
    && date.getUTCDate() === day;
}

function normalizeEmployeeStatus(value) {
  const status = String(value || '');
  return EMPLOYEE_STATUSES.has(status) ? status : '';
}

function normalizeSupervisorStatus(value) {
  const status = value == null ? '' : String(value);
  return SUPERVISOR_STATUSES.has(status) ? status : null;
}

function effectiveStatus(mission) {
  const supervisor = mission?.supervisorStatus || '';
  if (supervisor === 'not_done' || supervisor === 'incomplete') return supervisor;
  const employee = mission?.employeeStatus;
  if (employee === 'done' || employee === 'not_done') return employee;
  return 'pending';
}

function statusLabel(status) {
  if (status === 'done') return 'Réalisée';
  if (status === 'not_done') return 'Non réalisée';
  if (status === 'incomplete') return 'Incomplète';
  return 'À faire';
}

function presentMission(doc) {
  const employeeStatus = EMPLOYEE_STATUSES.has(doc?.employeeStatus) ? doc.employeeStatus : 'pending';
  const supervisorStatus = SUPERVISOR_STATUSES.has(doc?.supervisorStatus) ? doc.supervisorStatus : '';
  return {
    id: String(doc?._id || ''),
    employeeId: doc?.employeeId ? String(doc.employeeId) : '',
    employeeName: doc?.employeeName || '',
    title: doc?.title || '',
    detail: doc?.detail || '',
    date: doc?.date || '',
    employeeStatus,
    employeeNote: doc?.employeeNote || '',
    supervisorStatus,
    supervisorNote: doc?.supervisorNote || '',
    effectiveStatus: effectiveStatus({ employeeStatus, supervisorStatus }),
    createdByName: doc?.createdByName || '',
    createdAt: doc?.createdAt || null,
    updatedAt: doc?.updatedAt || null
  };
}

module.exports = {
  cleanLine,
  cleanBlock,
  isIsoDate,
  normalizeEmployeeStatus,
  normalizeSupervisorStatus,
  effectiveStatus,
  statusLabel,
  presentMission
};
