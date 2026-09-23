const assert = require('assert');
const hours = require('../services/staffPlanningHours');

assert.strictEqual(hours.formatHours(39), '39h');
assert.strictEqual(hours.formatHours(39 + 1 / 60), '39h01');
assert.strictEqual(hours.formatHours(5 + 10 / 60), '5h10');
assert.strictEqual(hours.formatHours(8.5), '8h30');
assert.strictEqual(hours.formatHours((310 + 540 + 510 + 310 + 481) / 60), '35h51');

const settings = hours.defaultSettings();
const days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'].map((day, i) => ({
  day,
  date: `2026-09-2${i}`
}));
const cells = {
  Lundi: { kind: 'shifts', shifts: [{ startTime: '08:00', endTime: '13:40' }] },
  Mardi: { kind: 'code', code: 'REPOS' },
  Mercredi: { kind: 'shifts', shifts: [{ startTime: '11:00', endTime: '20:30' }] },
  Jeudi: { kind: 'shifts', shifts: [{ startTime: '09:00', endTime: '18:00' }] },
  Vendredi: { kind: 'shifts', shifts: [{ startTime: '09:00', endTime: '14:40' }] },
  Samedi: { kind: 'shifts', shifts: [{ startTime: '11:59', endTime: '20:30' }] },
  Dimanche: { kind: 'code', code: 'REPOS' }
};
const computed = days.map((meta) => hours.computeDay(cells[meta.day], meta, settings, 39));
const sum = hours.summarizeDays(computed, 39, settings);
assert.strictEqual(hours.formatHours(sum.weeklyPaidHours), '35h51');

const leftoverCp = computed.map((day) => (
  day.day === 'Lundi' ? { ...day, cpHours: 3.15 } : day
));
const sumClean = hours.summarizeDays(leftoverCp, 39, settings);
assert.strictEqual(hours.formatHours(sumClean.weeklyPaidHours), '35h51');
assert.strictEqual(sumClean.weeklyCpHours, 0);

const noon = days.map((meta) => hours.computeDay(
  meta.day === 'Samedi'
    ? { kind: 'shifts', shifts: [{ startTime: '12:00', endTime: '20:30' }] }
    : cells[meta.day],
  meta,
  settings,
  39
));
assert.strictEqual(hours.formatHours(hours.summarizeDays(noon, 39, settings).weeklyPaidHours), '35h50');

console.log('staff planning hours tests OK');
