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

assert.strictEqual(hours.formatClockHours(26 / 60), '00.26');
assert.strictEqual(hours.formatClockHours(0.43), '00.26');
assert.strictEqual(hours.formatClockHours(1.5), '01.30');
assert.strictEqual(hours.parseClockHours('00.26'), 26 / 60);
assert.strictEqual(hours.parseClockHours('0.26'), 26 / 60);
assert.strictEqual(hours.parseClockHours('00,26'), 26 / 60);
assert.strictEqual(hours.parseClockHours('1.30'), 1.5);
assert.strictEqual(hours.parseClockHours('01.30'), 1.5);
assert.strictEqual(hours.parseClockHours('0h26'), 26 / 60);
assert.strictEqual(hours.parseClockHours('-00.26'), -26 / 60);
assert.ok(Number.isNaN(hours.parseClockHours('00.99')));

const paidWeek = 35 + 26 / 60;
assert.strictEqual(hours.formatHours(paidWeek), '35h26');
assert.strictEqual(
  hours.formatHours(hours.hoursFromMinutes(
    hours.minutesFromHours(paidWeek) - hours.minutesFromHours(hours.parseClockHours('00.26'))
  )),
  '35h'
);
assert.strictEqual(
  hours.formatHours(hours.parseClockHours('00.26')),
  '0h26'
);

const restSettings = hours.defaultSettings();
const sunday2030 = hours.computeDay(
  { kind: 'shifts', shifts: [{ startTime: '11:00', endTime: '20:30' }] },
  { day: 'Dimanche', date: '2026-10-04' },
  restSettings,
  35
);
const monday0600 = hours.computeDay(
  { kind: 'shifts', shifts: [{ startTime: '06:00', endTime: '14:00' }] },
  { day: 'Lundi', date: '2026-10-05' },
  restSettings,
  35
);
const monday0800 = hours.computeDay(
  { kind: 'shifts', shifts: [{ startTime: '08:00', endTime: '14:00' }] },
  { day: 'Lundi', date: '2026-10-05' },
  restSettings,
  35
);
const acrossShort = hours.summarizeDays(
  [monday0600],
  35,
  restSettings,
  [],
  { previousDay: sunday2030 }
);
assert.strictEqual(
  acrossShort.days[0].alerts.filter((alert) => alert.type === 'min_rest').length,
  1,
  '20h30 -> 06h00 doit alerter (9h30 < 11h)'
);
assert.ok(acrossShort.days[0].alerts.find((alert) => alert.type === 'min_rest').message.includes('9h30'));

const acrossOk = hours.summarizeDays(
  [monday0800],
  35,
  restSettings,
  [],
  { previousDay: sunday2030 }
);
assert.strictEqual(
  acrossOk.days[0].alerts.filter((alert) => alert.type === 'min_rest').length,
  0,
  '20h30 -> 08h00 ne doit pas alerter (11h30)'
);

const sundayWarned = hours.summarizeDays(
  [sunday2030],
  35,
  restSettings,
  [],
  { nextDay: monday0600 }
);
assert.strictEqual(
  sundayWarned.days[0].alerts.filter((alert) => alert.type === 'min_rest').length,
  1,
  'dimanche 20h30 doit alerter si le lundi suivant commence à 06h'
);

const saturday2030 = hours.computeDay(
  { kind: 'shifts', shifts: [{ startTime: '12:00', endTime: '20:30' }] },
  { day: 'Samedi', date: '2026-10-03' },
  restSettings,
  35
);
const sunday0600 = hours.computeDay(
  { kind: 'shifts', shifts: [{ startTime: '06:00', endTime: '12:00' }] },
  { day: 'Dimanche', date: '2026-10-04' },
  restSettings,
  35
);
const intraWeek = hours.summarizeDays([saturday2030, sunday0600], 35, restSettings);
assert.strictEqual(
  intraWeek.days[1].alerts.filter((alert) => alert.type === 'min_rest').length,
  1,
  'samedi 20h30 -> dimanche 06h00 reste alerte dans la même semaine'
);

console.log('staff planning hours tests OK');
