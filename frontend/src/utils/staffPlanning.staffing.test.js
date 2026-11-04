import assert from 'assert';
import {
  isCfaDay,
  isShopStaffedDay,
  categoryDayStaffing,
  clockToMinutes,
  formatHours,
  formatStaffingCell,
  flattenGroupedPlanningRows,
  isShopCoverageOk
} from './staffPlanning.js';

assert.strictEqual(isShopStaffedDay({ kind: 'shifts', paidHours: 8 }), true);
assert.strictEqual(isShopStaffedDay({ kind: 'hours', paidHours: 6.5 }), true);
assert.strictEqual(isShopStaffedDay({ kind: 'code', code: 'REPOS', paidHours: 0 }), false);
assert.strictEqual(isShopStaffedDay({ kind: 'code', code: 'CFA8', paidHours: 8 }), false);
assert.strictEqual(isShopStaffedDay({ kind: 'code', code: 'CP', paidHours: 0, cpHours: 5.83 }), false);
assert.strictEqual(isShopStaffedDay({ kind: 'empty', paidHours: 0 }), false);
assert.strictEqual(isCfaDay({ kind: 'code', code: 'CFA8', paidHours: 8 }), true);
assert.strictEqual(isShopStaffedDay({ kind: 'hours', code: 'CFA8', paidHours: 8 }), false);
assert.strictEqual(isShopStaffedDay({
  kind: 'shifts',
  paidHours: 8,
  isCfa: true,
  shifts: [{ startTime: '08:00', endTime: '16:00' }]
}), false);

const rows = [
  {
    employeeName: 'Lea',
    days: [
      { day: 'Lundi', kind: 'shifts', paidHours: 8 },
      { day: 'Mardi', kind: 'code', code: 'REPOS', paidHours: 0 },
      { day: 'Mercredi', kind: 'shifts', paidHours: 8.5 }
    ]
  },
  {
    employeeName: 'Phi',
    days: [
      { day: 'Lundi', kind: 'shifts', paidHours: 7 },
      { day: 'Mardi', kind: 'shifts', paidHours: 8 },
      { day: 'Mercredi', kind: 'code', code: 'CFA8', paidHours: 8 }
    ]
  }
];

const staffing = categoryDayStaffing(rows);
assert.strictEqual(staffing.days[0].count, 2);
assert.strictEqual(formatStaffingCell(staffing.days[0].count, staffing.days[0].hours), '2 / 15h');
assert.strictEqual(staffing.days[1].count, 1);
assert.strictEqual(formatStaffingCell(staffing.days[1].count, staffing.days[1].hours), '1 / 8h');
assert.strictEqual(staffing.days[2].count, 1);
assert.strictEqual(formatStaffingCell(staffing.days[2].count, staffing.days[2].hours), '1 / 8h30');
assert.strictEqual(formatHours(staffing.weekHours), '31h30');

const flat = flattenGroupedPlanningRows([
  { id: 'vente', label: 'Vendeurs', rows }
]);
assert.strictEqual(flat[0]._group, true);
assert.strictEqual(flat[flat.length - 1]._staffing, true);

assert.strictEqual(clockToMinutes('06:00'), 360);
assert.strictEqual(clockToMinutes('06h'), 360);
assert.strictEqual(clockToMinutes('20:30'), 1230);
assert.strictEqual(isShopCoverageOk(1, 2), true);
assert.strictEqual(isShopCoverageOk(1, 1), false);
assert.strictEqual(isShopCoverageOk(0, 2), false);

const coveredRows = [
  {
    employeeName: 'Ouverture',
    days: [{ day: 'Lundi', kind: 'shifts', paidHours: 8, shifts: [{ startTime: '06:00', endTime: '14:00' }] }]
  },
  {
    employeeName: 'Soir 1',
    days: [{ day: 'Lundi', kind: 'shifts', paidHours: 7, shifts: [{ startTime: '13:00', endTime: '20:30' }] }]
  },
  {
    employeeName: 'Soir 2',
    days: [{ day: 'Lundi', kind: 'shifts', paidHours: 6.5, shifts: [{ startTime: '14:00', endTime: '20:30' }] }]
  }
];
assert.strictEqual(categoryDayStaffing(coveredRows).days[0].covered, true);
assert.strictEqual(categoryDayStaffing(coveredRows).days[0].openCount, 1);
assert.strictEqual(categoryDayStaffing(coveredRows).days[0].closeCount, 2);

const missingClose = coveredRows.slice(0, 2);
assert.strictEqual(categoryDayStaffing(missingClose).days[0].covered, false);

const withCfa = categoryDayStaffing([
  {
    employeeName: 'Apprenti',
    days: [{
      day: 'Lundi',
      kind: 'shifts',
      paidHours: 8,
      isCfa: true,
      shifts: [{ startTime: '06:00', endTime: '14:00' }]
    }]
  },
  {
    employeeName: 'Vendeur',
    days: [{
      day: 'Lundi',
      kind: 'shifts',
      paidHours: 7,
      shifts: [{ startTime: '13:00', endTime: '20:30' }]
    }]
  }
]);
assert.strictEqual(withCfa.days[0].count, 1);
assert.strictEqual(formatHours(withCfa.days[0].hours), '7h');
assert.strictEqual(withCfa.days[0].openCount, 0);

console.log('staffPlanning staffing tests OK');
