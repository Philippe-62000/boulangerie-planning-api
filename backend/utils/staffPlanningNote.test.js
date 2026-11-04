const assert = require('assert');
const { MAX_PLANNING_NOTE, sanitizePlanningNote } = require('./staffPlanningNote');

assert.strictEqual(sanitizePlanningNote('  Repos mercredi  '), 'Repos mercredi');
assert.strictEqual(sanitizePlanningNote('ligne 1\r\nligne 2'), 'ligne 1\nligne 2');
assert.strictEqual(sanitizePlanningNote(null), '');
assert.strictEqual(sanitizePlanningNote(undefined), '');
assert.strictEqual(sanitizePlanningNote('a'.repeat(MAX_PLANNING_NOTE + 40)).length, MAX_PLANNING_NOTE);

console.log('staffPlanningNote tests OK');
