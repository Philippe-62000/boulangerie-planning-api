const { PHASES, TASKS } = require('../constants/vendeuseWorkPosts');

const ROLE_SEED = [
  { id: 'vente', label: 'Vente' },
  { id: 'boulanger', label: 'Boulanger' },
  { id: 'preparateur', label: 'Préparateur' }
];

const VENTE_MENU_SEED = [
  { id: 'ouverture', label: 'Ouverture', hint: '' },
  { id: 'matin', label: 'Matin', hint: 'Tâches du matin, après l’ouverture.' },
  { id: 'avant-rush', label: 'Avant Rush', hint: 'Mise en place avant le coup de feu.' },
  { id: 'apres-rush', label: 'Après Rush', hint: '' },
  { id: 'fermeture', label: 'Fermeture', hint: '' }
];

function sortByOrder(list) {
  return [...(list || [])].sort((a, b) => (
    (Number(a?.order) || 0) - (Number(b?.order) || 0)
    || String(a?.label || '').localeCompare(String(b?.label || ''), 'fr')
  ));
}

function cleanLine(value, max) {
  return String(value || '').replace(/\s+/g, ' ').trim().slice(0, max);
}

function cleanBlock(value, max) {
  return String(value || '').replace(/\r\n/g, '\n').trim().slice(0, max);
}

function slugId(label, used) {
  const base = cleanLine(label, 80)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40) || 'element';
  let id = base;
  let index = 2;
  while (used.has(id)) {
    id = `${base}-${index++}`;
  }
  used.add(id);
  return id;
}

function usedIds(roles) {
  const used = new Set();
  for (const role of roles || []) {
    if (role?.id) used.add(role.id);
    for (const menu of role?.menus || []) {
      if (menu?.id) used.add(menu.id);
      for (const item of menu?.items || []) {
        if (item?.id) used.add(item.id);
      }
    }
  }
  return used;
}

function seedRoles() {
  const hints = new Map(PHASES.map((phase) => [phase.id, phase.hint || '']));
  const byPhase = new Map();
  TASKS.forEach((task) => {
    if (!byPhase.has(task.phase)) byPhase.set(task.phase, []);
    byPhase.get(task.phase).push(task);
  });

  return ROLE_SEED.map((role, roleIndex) => ({
    id: role.id,
    label: role.label,
    visible: true,
    order: roleIndex,
    menus: role.id === 'vente'
      ? VENTE_MENU_SEED.map((menu, menuIndex) => ({
        id: menu.id,
        label: menu.label,
        hint: menu.hint || hints.get(menu.id) || '',
        visible: true,
        order: menuIndex,
        items: (byPhase.get(menu.id) || []).map((task, itemIndex) => ({
          id: task.id,
          label: task.label,
          detail: task.detail || '',
          group: task.group || '',
          groupLabel: task.groupLabel || '',
          weekly: !!task.weekly,
          visible: true,
          order: itemIndex
        }))
      }))
      : []
  }));
}

function projectCatalog(catalog, { visibleOnly = true, roleId = '' } = {}) {
  const menus = [];
  const phases = [];
  const tasks = [];
  for (const role of sortByOrder(catalog?.roles)) {
    if (visibleOnly && role.visible === false) continue;
    const roleMenus = [];
    const includeItems = !roleId || role.id === roleId;
    for (const menu of sortByOrder(role.menus)) {
      if (visibleOnly && menu.visible === false) continue;
      roleMenus.push({
        id: menu.id,
        label: menu.label,
        hint: menu.hint || ''
      });
      if (!includeItems) continue;
      phases.push({
        id: menu.id,
        label: menu.label,
        hint: menu.hint || '',
        roleId: role.id
      });
      for (const item of sortByOrder(menu.items)) {
        if (visibleOnly && item.visible === false) continue;
        tasks.push({
          id: item.id,
          phase: menu.id,
          label: item.label,
          detail: item.detail || '',
          group: item.group || '',
          groupLabel: item.groupLabel || '',
          weekly: !!item.weekly
        });
      }
    }
    menus.push({ id: role.id, label: role.label, menus: roleMenus });
  }
  return { menus, phases, tasks };
}

function serializeCatalog(catalog) {
  return {
    roles: sortByOrder(catalog?.roles).map((role) => ({
      id: role.id,
      label: role.label,
      visible: role.visible !== false,
      menus: sortByOrder(role.menus).map((menu) => ({
        id: menu.id,
        label: menu.label,
        hint: menu.hint || '',
        visible: menu.visible !== false,
        items: sortByOrder(menu.items).map((item) => ({
          id: item.id,
          label: item.label,
          detail: item.detail || '',
          groupLabel: item.groupLabel || '',
          weekly: !!item.weekly,
          visible: item.visible !== false
        }))
      }))
    }))
  };
}

function findRole(roles, roleId) {
  return (roles || []).find((role) => role.id === roleId) || null;
}

function findMenu(role, menuId) {
  return (role?.menus || []).find((menu) => menu.id === menuId) || null;
}

function moveList(list, id, direction) {
  const ordered = sortByOrder(list);
  const index = ordered.findIndex((entry) => entry.id === id);
  const target = direction === 'up' ? index - 1 : index + 1;
  if (index < 0 || target < 0 || target >= ordered.length) return null;
  const [entry] = ordered.splice(index, 1);
  ordered.splice(target, 0, entry);
  ordered.forEach((item, order) => {
    item.order = order;
  });
  return ordered;
}

function moveCatalog(roles, payload) {
  const level = payload?.level;
  const direction = payload?.direction === 'up' ? 'up' : payload?.direction === 'down' ? 'down' : '';
  if (!direction) return 'Indiquez si l’élément monte ou descend.';
  if (level === 'role') {
    const next = moveList(roles, payload.roleId, direction);
    if (!next) return 'Ce menu est déjà au bout de la liste.';
    roles.splice(0, roles.length, ...next);
    return '';
  }
  const role = findRole(roles, payload.roleId);
  if (!role) return 'Menu introuvable.';
  if (level === 'menu') {
    const next = moveList(role.menus, payload.menuId, direction);
    if (!next) return 'Ce menu est déjà au bout de la liste.';
    role.menus = next;
    return '';
  }
  if (level === 'item') {
    const menu = findMenu(role, payload.menuId);
    if (!menu) return 'Menu introuvable.';
    const next = moveList(menu.items, payload.itemId, direction);
    if (!next) return 'Cette tâche est déjà au bout de la liste.';
    menu.items = next;
    return '';
  }
  return 'Déplacement impossible.';
}

function patchRole(roles, roleId, body) {
  const role = findRole(roles, roleId);
  if (!role) return 'Menu introuvable.';
  if (body.label !== undefined) {
    const label = cleanLine(body.label, 80);
    if (!label) return 'Le nom du menu est obligatoire.';
    role.label = label;
  }
  if (body.visible !== undefined) role.visible = !!body.visible;
  return '';
}

function patchMenu(roles, roleId, menuId, body) {
  const menu = findMenu(findRole(roles, roleId), menuId);
  if (!menu) return 'Menu introuvable.';
  if (body.label !== undefined) {
    const label = cleanLine(body.label, 80);
    if (!label) return 'Le nom du menu est obligatoire.';
    menu.label = label;
  }
  if (body.hint !== undefined) menu.hint = cleanLine(body.hint, 240);
  if (body.visible !== undefined) menu.visible = !!body.visible;
  return '';
}

function patchItem(roles, roleId, menuId, itemId, body) {
  const menu = findMenu(findRole(roles, roleId), menuId);
  const item = (menu?.items || []).find((entry) => entry.id === itemId);
  if (!item) return 'Tâche introuvable.';
  if (body.label !== undefined) {
    const label = cleanLine(body.label, 180);
    if (!label) return 'Le texte de la tâche est obligatoire.';
    item.label = label;
  }
  if (body.detail !== undefined) item.detail = cleanBlock(body.detail, 800);
  if (body.groupLabel !== undefined) {
    item.groupLabel = cleanLine(body.groupLabel, 80);
    item.group = item.groupLabel ? slugId(item.groupLabel, new Set()) : '';
  }
  if (body.weekly !== undefined) item.weekly = !!body.weekly;
  if (body.visible !== undefined) item.visible = !!body.visible;
  return '';
}

function addMenu(roles, roleId, body) {
  const role = findRole(roles, roleId);
  if (!role) return 'Menu introuvable.';
  const label = cleanLine(body?.label, 80);
  if (!label) return 'Le nom du menu est obligatoire.';
  const ordered = sortByOrder(role.menus);
  ordered.push({
    id: slugId(label, usedIds(roles)),
    label,
    hint: cleanLine(body?.hint, 240),
    visible: true,
    order: ordered.length,
    items: []
  });
  role.menus = ordered;
  return '';
}

function addItem(roles, roleId, menuId, body) {
  const menu = findMenu(findRole(roles, roleId), menuId);
  if (!menu) return 'Menu introuvable.';
  const label = cleanLine(body?.label, 180);
  if (!label) return 'Le texte de la tâche est obligatoire.';
  const groupLabel = cleanLine(body?.groupLabel, 80);
  const ordered = sortByOrder(menu.items);
  ordered.push({
    id: slugId(label, usedIds(roles)),
    label,
    detail: cleanBlock(body?.detail, 800),
    group: groupLabel ? slugId(groupLabel, new Set()) : '',
    groupLabel,
    weekly: !!body?.weekly,
    visible: true,
    order: ordered.length
  });
  menu.items = ordered;
  return '';
}

function removeItem(roles, roleId, menuId, itemId) {
  const menu = findMenu(findRole(roles, roleId), menuId);
  if (!menu) return 'Menu introuvable.';
  const ordered = sortByOrder(menu.items).filter((item) => item.id !== itemId);
  if (ordered.length === (menu.items || []).length) return 'Tâche introuvable.';
  ordered.forEach((item, order) => {
    item.order = order;
  });
  menu.items = ordered;
  return '';
}

module.exports = {
  seedRoles,
  projectCatalog,
  serializeCatalog,
  moveCatalog,
  patchRole,
  patchMenu,
  patchItem,
  addMenu,
  addItem,
  removeItem
};
