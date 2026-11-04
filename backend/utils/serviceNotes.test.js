const assert = require('assert');
const notes = require('./serviceNotes');

assert.strictEqual(notes.normalizeAudience('vente'), 'vente');
assert.strictEqual(notes.normalizeAudience('inconnu'), 'all');
assert.strictEqual(notes.audienceLabel('preparation'), 'Tous les préparateurs');

const sale = { _id: '1', name: 'Léa', isActive: true, employeeCategory: 'vente' };
const baker = { _id: '2', name: 'Paul', isActive: true, employeeCategory: 'boulanger' };
const prep = { _id: '3', name: 'Nina', isActive: true, employeeCategory: 'preparation' };
const inactive = { _id: '4', name: 'Old', isActive: false, employeeCategory: 'vente' };

assert.strictEqual(notes.employeeMatchesAudience(sale, 'all'), true);
assert.strictEqual(notes.employeeMatchesAudience(baker, 'vente'), false);
assert.strictEqual(notes.employeeMatchesAudience(prep, 'preparation'), true);
assert.strictEqual(notes.employeeMatchesAudience(inactive, 'all'), false);

const all = notes.buildRecipients([sale, baker, prep, inactive], 'all');
assert.deepStrictEqual(all.map((item) => item.employeeName), ['Léa', 'Paul', 'Nina']);

const bakers = notes.buildRecipients([sale, baker, prep], 'boulanger');
assert.strictEqual(bakers.length, 1);
assert.strictEqual(String(bakers[0].employeeId), '2');

const stats = notes.recipientStats([
  { viewedAt: new Date(), signedAt: new Date() },
  { viewedAt: new Date() },
  {}
]);
assert.deepStrictEqual(stats, { recipientCount: 3, viewedCount: 2, signedCount: 1 });

assert.strictEqual(notes.defaultTitle('  Bonjour  '), 'Bonjour');
assert.ok(notes.defaultTitle('x'.repeat(100)).endsWith('…'));

console.log('service notes helpers OK');
