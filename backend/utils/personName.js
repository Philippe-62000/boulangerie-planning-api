/** Comparaison souple des noms (accents, casse, espaces). */
const normalizePersonName = (name) =>
  String(name || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ');

/** Tokens triés : « Maryam MOHAMMAD » = « MOHAMMAD Maryam ». */
const personNameTokenKey = (name) => {
  const withoutRole = normalizePersonName(name).replace(/\s+-\s+.+$/, '');
  return withoutRole
    .split(/[\s-]+/)
    .filter(Boolean)
    .sort()
    .join(' ');
};

const findEmployeeByPersonName = (employees, personName) => {
  const target = normalizePersonName(personName);
  if (!target) return null;
  const exact = employees.find((emp) => normalizePersonName(emp.name) === target);
  if (exact) return exact;
  const tokenKey = personNameTokenKey(personName);
  if (!tokenKey.includes(' ')) return null;
  return employees.find((emp) => personNameTokenKey(emp.name) === tokenKey) || null;
};

module.exports = {
  normalizePersonName,
  personNameTokenKey,
  findEmployeeByPersonName
};
