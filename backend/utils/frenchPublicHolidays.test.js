const assert = require('assert');
const {
  easterSunday,
  frenchPublicHolidays,
  holidaysForIsoDates
} = require('./frenchPublicHolidays');

function iso(date) {
  return date.toISOString().slice(0, 10);
}

assert.strictEqual(iso(easterSunday(2024)), '2024-03-31');
assert.strictEqual(iso(easterSunday(2025)), '2025-04-20');
assert.strictEqual(iso(easterSunday(2026)), '2026-04-05');
assert.strictEqual(iso(easterSunday(2027)), '2027-03-28');

const holidays2026 = frenchPublicHolidays(2026);
const byName = Object.fromEntries(holidays2026.map((item) => [item.name, item.date]));
assert.strictEqual(byName['Jour de l\'an'], '2026-01-01');
assert.strictEqual(byName['Lundi de Pâques'], '2026-04-06');
assert.strictEqual(byName['Fête du Travail'], '2026-05-01');
assert.strictEqual(byName.Ascension, '2026-05-14');
assert.strictEqual(byName['Lundi de Pentecôte'], '2026-05-25');
assert.strictEqual(byName['Fête nationale'], '2026-07-14');
assert.strictEqual(byName.Noël, '2026-12-25');
assert.strictEqual(holidays2026.length, 11);

assert.deepStrictEqual(
  holidaysForIsoDates(['2026-07-13', '2026-07-14', '2026-07-15']),
  ['2026-07-14']
);

console.log('frenchPublicHolidays tests OK');
