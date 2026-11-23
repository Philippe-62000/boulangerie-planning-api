const { cleanLine } = require('./workMission');

function normalizeQuantity(value) {
  const raw = String(value ?? '').replace(',', '.').trim();
  if (!/^\d+(\.\d{1,2})?$/.test(raw)) return null;
  const quantity = Math.round(Number(raw) * 100) / 100;
  if (!Number.isFinite(quantity) || quantity <= 0 || quantity > 99999) return null;
  return quantity;
}

function normalizeLabel(value) {
  return cleanLine(value, 200);
}

function presentLog(doc) {
  return {
    id: String(doc?._id || ''),
    employeeId: doc?.employeeId ? String(doc.employeeId) : '',
    employeeName: doc?.employeeName || '',
    date: doc?.date || '',
    label: doc?.label || '',
    quantity: Number(doc?.quantity) || 0,
    createdAt: doc?.createdAt || null,
    updatedAt: doc?.updatedAt || null
  };
}

module.exports = {
  normalizeQuantity,
  normalizeLabel,
  presentLog
};
