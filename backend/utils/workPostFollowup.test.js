const assert = require('assert');
const { TASKS } = require('../constants/vendeuseWorkPosts');
const {
  isVendeuseEmployee,
  normalizeAnswers,
  normalizePostes,
  dayIssues,
  validationError
} = require('./workPostFollowup');

const ids = TASKS.map((task) => task.id);
assert.strictEqual(new Set(ids).size, ids.length, 'identifiants de tâches uniques');
assert.ok(TASKS.filter((task) => task.phase === 'ouverture').length >= 19);
assert.ok(TASKS.some((task) => task.id === 'fer-pizza-rond'));
assert.strictEqual(TASKS.filter((task) => task.label.toLowerCase().includes('rond feston')).length, 1);
assert.ok(TASKS.find((task) => task.id === 'rush-plaques')?.weekly);

assert.strictEqual(isVendeuseEmployee({ role: 'vendeuse', isActive: true }), true);
assert.strictEqual(isVendeuseEmployee({ role: 'Apprenti Vendeuse', isActive: true }), true);
assert.strictEqual(isVendeuseEmployee({ role: 'apprenti', employeeCategory: 'vente', isActive: true }), true);
assert.strictEqual(isVendeuseEmployee({ role: 'Apprenti Boulanger', isActive: true }), false);
assert.strictEqual(isVendeuseEmployee({ role: 'vendeuse', isActive: false }), false);
assert.strictEqual(isVendeuseEmployee({ role: 'boulanger', isActive: true }), false);

assert.deepStrictEqual(normalizePostes(['ouverture', 'ouverture', 'inconnu', 'fermeture']), ['ouverture', 'fermeture']);

const normalized = normalizeAnswers([
  { taskId: 'ouv-allumer-boutique', status: 'done', reason: 'ignorée' },
  { taskId: 'ouv-allumer-boutique', status: 'not_done', reason: 'doublon' },
  { taskId: 'inconnu', status: 'done' },
  { taskId: 'rush-plaques', status: 'skipped', reason: '  fait mardi  ' },
  { taskId: 'ouv-machine-cafe', status: 'skipped', reason: 'non hebdo' }
]);
assert.strictEqual(normalized.find((item) => item.taskId === 'ouv-allumer-boutique').reason, '');
assert.strictEqual(normalized.find((item) => item.taskId === 'rush-plaques').reason, 'fait mardi');
assert.strictEqual(normalized.find((item) => item.taskId === 'ouv-machine-cafe').status, 'pending');

const ouvertureIds = TASKS.filter((task) => task.phase === 'ouverture').map((task) => task.id);
const allDone = ouvertureIds.map((taskId) => ({ taskId, status: 'done' }));
const doneIssues = dayIssues(['ouverture'], allDone);
assert.strictEqual(doneIssues.ok, true);
assert.strictEqual(doneIssues.pending.length, 0);
assert.strictEqual(validationError(doneIssues, ['ouverture']), '');

const empty = dayIssues([], []);
assert.strictEqual(empty.ok, false);
assert.ok(validationError(empty, []).includes('poste'));

const missing = dayIssues(['ouverture'], TASKS.filter((task) => task.phase === 'ouverture').map((task) => (
  task.id === 'ouv-allumer-boutique'
    ? { taskId: task.id, status: 'not_done', reason: '' }
    : { taskId: task.id, status: 'done' }
)));
assert.strictEqual(missing.ok, false);
assert.ok(missing.missingReason.some((task) => task.id === 'ouv-allumer-boutique'));
assert.strictEqual(missing.pending.length, 0);
assert.ok(validationError(missing, ['ouverture']).includes('raison'));

const withReason = dayIssues(['fermeture'], TASKS.filter((task) => task.phase === 'fermeture').map((task) => (
  task.id === 'fer-portes'
    ? { taskId: task.id, status: 'not_done', reason: 'Porte déjà fermée par la collègue' }
    : { taskId: task.id, status: 'done' }
)));
assert.strictEqual(withReason.ok, true);
assert.strictEqual(withReason.notDone.length, 1);

const weekly = dayIssues(['apres-rush'], [
  ...TASKS.filter((task) => task.phase === 'apres-rush' && task.id !== 'rush-plaques').map((task) => ({ taskId: task.id, status: 'done' })),
  { taskId: 'rush-plaques', status: 'skipped', reason: '' }
]);
assert.strictEqual(weekly.ok, false);
const weeklyOk = dayIssues(['apres-rush'], [
  ...TASKS.filter((task) => task.phase === 'apres-rush' && task.id !== 'rush-plaques').map((task) => ({ taskId: task.id, status: 'done' })),
  { taskId: 'rush-plaques', status: 'skipped', reason: 'fait lundi' }
]);
assert.strictEqual(weeklyOk.ok, true);
assert.strictEqual(weeklyOk.notDone.length, 0);

console.log(`work post followup OK (${TASKS.length} tâches)`);
