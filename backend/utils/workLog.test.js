const assert = require('assert');
const { normalizeQuantity, normalizeLabel, presentLog } = require('./workLog');

assert.strictEqual(normalizeQuantity('8'), 8);
assert.strictEqual(normalizeQuantity('8,5'), 8.5);
assert.strictEqual(normalizeQuantity('0'), null);
assert.strictEqual(normalizeQuantity('-2'), null);
assert.strictEqual(normalizeQuantity('abc'), null);
assert.strictEqual(normalizeLabel('  jalbon   beurre '), 'jalbon beurre');

const presented = presentLog({
  _id: 'abc',
  employeeId: 'emp',
  employeeName: 'Léa',
  date: '2026-11-23',
  label: 'jalbon beurre',
  quantity: 8
});
assert.strictEqual(presented.quantity, 8);
assert.strictEqual(presented.label, 'jalbon beurre');

console.log('workLog.test.js OK');
