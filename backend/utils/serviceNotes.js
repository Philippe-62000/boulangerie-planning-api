const AUDIENCES = [
  { id: 'all', label: 'Tous les salariés' },
  { id: 'vente', label: 'Tous les vendeurs' },
  { id: 'boulanger', label: 'Tous les boulangers' },
  { id: 'preparation', label: 'Tous les préparateurs' }
];

const AUDIENCE_IDS = new Set(AUDIENCES.map((item) => item.id));

function normalizeAudience(value) {
  const id = String(value || 'all').trim();
  return AUDIENCE_IDS.has(id) ? id : 'all';
}

function audienceLabel(value) {
  const id = normalizeAudience(value);
  return AUDIENCES.find((item) => item.id === id)?.label || 'Tous les salariés';
}

function employeeMatchesAudience(employee, audience) {
  if (!employee || employee.isActive === false) return false;
  const id = normalizeAudience(audience);
  if (id === 'all') return true;
  return String(employee.employeeCategory || 'vente') === id;
}

function buildRecipients(employees, audience, assignedAt = new Date()) {
  return (employees || [])
    .filter((employee) => employeeMatchesAudience(employee, audience))
    .map((employee) => ({
      employeeId: employee._id,
      employeeName: employee.name || '',
      assignedAt
    }));
}

function recipientStats(recipients = []) {
  const list = recipients || [];
  return {
    recipientCount: list.length,
    viewedCount: list.filter((item) => item.viewedAt).length,
    signedCount: list.filter((item) => item.signedAt).length
  };
}

function defaultTitle(content) {
  const text = String(content || '').replace(/\s+/g, ' ').trim();
  if (!text) return 'Note de service';
  return text.length > 80 ? `${text.slice(0, 77)}…` : text;
}

module.exports = {
  AUDIENCES,
  normalizeAudience,
  audienceLabel,
  employeeMatchesAudience,
  buildRecipients,
  recipientStats,
  defaultTitle
};
