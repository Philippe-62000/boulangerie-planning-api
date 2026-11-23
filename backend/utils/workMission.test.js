const assert = require('assert');
const {
  cleanLine,
  isIsoDate,
  normalizeEmployeeStatus,
  normalizeSupervisorStatus,
  effectiveStatus,
  presentMission
} = require('./workMission');

assert.strictEqual(cleanLine('  ranger   le  four  ', 20), 'ranger le four');
assert.strictEqual(isIsoDate('2026-11-23'), true);
assert.strictEqual(isIsoDate('2026-02-31'), false);
assert.strictEqual(isIsoDate('23-11-2026'), false);
assert.strictEqual(normalizeEmployeeStatus('done'), 'done');
assert.strictEqual(normalizeEmployeeStatus('incomplete'), '');
assert.strictEqual(normalizeSupervisorStatus('incomplete'), 'incomplete');
assert.strictEqual(normalizeSupervisorStatus(''), '');
assert.strictEqual(normalizeSupervisorStatus('done'), null);

assert.strictEqual(effectiveStatus({ employeeStatus: 'done', supervisorStatus: '' }), 'done');
assert.strictEqual(effectiveStatus({ employeeStatus: 'done', supervisorStatus: 'not_done' }), 'not_done');
assert.strictEqual(effectiveStatus({ employeeStatus: 'done', supervisorStatus: 'incomplete' }), 'incomplete');
assert.strictEqual(effectiveStatus({ employeeStatus: 'pending', supervisorStatus: '' }), 'pending');

const presented = presentMission({
  _id: 'abc',
  employeeId: 'emp',
  employeeName: 'Léa',
  title: 'Nettoyer le four',
  date: '2026-11-23',
  employeeStatus: 'done',
  supervisorStatus: 'incomplete'
});
assert.strictEqual(presented.effectiveStatus, 'incomplete');
assert.strictEqual(presented.employeeStatus, 'done');
assert.strictEqual(presented.title, 'Nettoyer le four');

console.log('workMission.test.js OK');
