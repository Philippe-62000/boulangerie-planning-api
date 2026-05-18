/** Comparaison souple des noms (accents, casse, espaces). */
const normalizePersonName = (name) =>
  String(name || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ');

const findEmployeeByPersonName = (employees, personName) => {
  const target = normalizePersonName(personName);
  if (!target) return null;
  return employees.find((emp) => normalizePersonName(emp.name) === target) || null;
};

module.exports = {
  normalizePersonName,
  findEmployeeByPersonName
};
