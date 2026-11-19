const assert = require('assert');
const {
  seedRoles,
  projectCatalog,
  moveCatalog,
  patchItem,
  addItem,
  removeItem
} = require('./workPostCatalog');

const roles = seedRoles();
assert.deepStrictEqual(
  roles.map((role) => role.id),
  ['vente', 'boulanger', 'preparateur']
);
assert.deepStrictEqual(
  roles[0].menus.map((menu) => menu.id),
  ['ouverture', 'matin', 'avant-rush', 'apres-rush', 'fermeture']
);
assert.ok(roles[0].menus.find((menu) => menu.id === 'ouverture').items.length >= 19);
assert.strictEqual(roles[1].menus.length, 0);

const view = projectCatalog({ roles }, { visibleOnly: true, roleId: 'vente' });
assert.ok(view.menus.some((role) => role.id === 'boulanger'));
assert.ok(view.tasks.some((task) => task.id === 'ouv-allumer-boutique'));
assert.ok(view.tasks.every((task) => roles[0].menus.some((menu) => menu.id === task.phase)));
assert.strictEqual(view.phases.map((phase) => phase.id).includes('matin'), true);

roles[0].menus.find((menu) => menu.id === 'matin').visible = false;
const hiddenMenu = projectCatalog({ roles }, { visibleOnly: true, roleId: 'vente' });
assert.strictEqual(hiddenMenu.menus[0].menus.some((menu) => menu.id === 'matin'), false);

const firstItem = roles[0].menus[0].items[0];
firstItem.visible = false;
const hiddenItem = projectCatalog({ roles }, { visibleOnly: true, roleId: 'vente' });
assert.strictEqual(hiddenItem.tasks.some((task) => task.id === firstItem.id), false);

assert.strictEqual(moveCatalog(roles, { level: 'menu', roleId: 'vente', menuId: 'fermeture', direction: 'up' }), '');
const menuIds = roles[0].menus.map((menu) => menu.id);
assert.strictEqual(menuIds[menuIds.length - 1], 'apres-rush');
assert.strictEqual(menuIds[menuIds.length - 2], 'fermeture');

assert.strictEqual(moveCatalog(roles, { level: 'item', roleId: 'vente', menuId: 'ouverture', itemId: roles[0].menus[0].items[0].id, direction: 'down' }), '');
assert.notStrictEqual(roles[0].menus[0].items[0].id, 'ouv-allumer-boutique');

assert.ok(patchItem(roles, 'vente', 'ouverture', roles[0].menus[0].items[0].id, { label: '' }).includes('obligatoire'));
assert.strictEqual(addItem(roles, 'vente', 'matin', { label: 'Contrôle du comptoir' }), '');
assert.strictEqual(roles[0].menus.find((menu) => menu.id === 'matin').items[0].label, 'Contrôle du comptoir');
const addedId = roles[0].menus.find((menu) => menu.id === 'matin').items[0].id;
assert.strictEqual(removeItem(roles, 'vente', 'matin', addedId), '');
assert.strictEqual(roles[0].menus.find((menu) => menu.id === 'matin').items.length, 0);

console.log('work post catalog OK');
