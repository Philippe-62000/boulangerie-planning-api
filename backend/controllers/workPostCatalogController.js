const WorkPostCatalog = require('../models/WorkPostCatalog');
const {
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
} = require('../utils/workPostCatalog');

const ID_RE = /^[a-z0-9][a-z0-9-]{0,79}$/;

function isAdmin(req) {
  return req.user?.role === 'admin';
}

function validId(value) {
  return ID_RE.test(String(value || ''));
}

async function ensureCatalog() {
  const existing = await WorkPostCatalog.findOne({ key: 'default' });
  if (existing) return existing;
  try {
    return await WorkPostCatalog.create({ key: 'default', roles: seedRoles() });
  } catch (error) {
    if (error && error.code === 11000) return WorkPostCatalog.findOne({ key: 'default' });
    throw error;
  }
}

async function employeeView(roleId) {
  const doc = await ensureCatalog();
  return projectCatalog(doc.toObject(), { visibleOnly: true, roleId: roleId || '' });
}

async function visibleMenus() {
  const doc = await ensureCatalog();
  return projectCatalog(doc.toObject(), { visibleOnly: true }).menus;
}

function refuseUnlessAdmin(req, res) {
  if (isAdmin(req)) return false;
  res.status(403).json({ success: false, error: 'Réservé au suivi Filmara.' });
  return true;
}

async function changeCatalog(res, mutate) {
  const doc = await ensureCatalog();
  const message = mutate(doc.roles);
  if (message) {
    res.status(400).json({ success: false, error: message });
    return;
  }
  doc.markModified('roles');
  await doc.save();
  res.json({ success: true, ...serializeCatalog(doc) });
}

exports.ensureCatalog = ensureCatalog;
exports.employeeView = employeeView;
exports.visibleMenus = visibleMenus;

exports.getCatalog = async (req, res) => {
  try {
    if (refuseUnlessAdmin(req, res)) return;
    const doc = await ensureCatalog();
    res.json({ success: true, ...serializeCatalog(doc) });
  } catch (error) {
    console.error('work-posts getCatalog', error);
    res.status(500).json({ success: false, error: 'Impossible de charger les menus.' });
  }
};

exports.patchRole = async (req, res) => {
  try {
    if (refuseUnlessAdmin(req, res)) return;
    if (!validId(req.params.roleId)) {
      return res.status(400).json({ success: false, error: 'Menu introuvable.' });
    }
    await changeCatalog(res, (roles) => patchRole(roles, req.params.roleId, req.body || {}));
  } catch (error) {
    console.error('work-posts patchRole', error);
    res.status(500).json({ success: false, error: 'Impossible de modifier le menu.' });
  }
};

exports.createMenu = async (req, res) => {
  try {
    if (refuseUnlessAdmin(req, res)) return;
    if (!validId(req.params.roleId)) {
      return res.status(400).json({ success: false, error: 'Menu introuvable.' });
    }
    await changeCatalog(res, (roles) => addMenu(roles, req.params.roleId, req.body || {}));
  } catch (error) {
    console.error('work-posts createMenu', error);
    res.status(500).json({ success: false, error: 'Impossible d’ajouter le menu.' });
  }
};

exports.patchMenu = async (req, res) => {
  try {
    if (refuseUnlessAdmin(req, res)) return;
    if (!validId(req.params.roleId) || !validId(req.params.menuId)) {
      return res.status(400).json({ success: false, error: 'Menu introuvable.' });
    }
    await changeCatalog(res, (roles) => patchMenu(roles, req.params.roleId, req.params.menuId, req.body || {}));
  } catch (error) {
    console.error('work-posts patchMenu', error);
    res.status(500).json({ success: false, error: 'Impossible de modifier le menu.' });
  }
};

exports.createItem = async (req, res) => {
  try {
    if (refuseUnlessAdmin(req, res)) return;
    if (!validId(req.params.roleId) || !validId(req.params.menuId)) {
      return res.status(400).json({ success: false, error: 'Menu introuvable.' });
    }
    await changeCatalog(res, (roles) => addItem(roles, req.params.roleId, req.params.menuId, req.body || {}));
  } catch (error) {
    console.error('work-posts createItem', error);
    res.status(500).json({ success: false, error: 'Impossible d’ajouter la tâche.' });
  }
};

exports.patchItem = async (req, res) => {
  try {
    if (refuseUnlessAdmin(req, res)) return;
    if (!validId(req.params.roleId) || !validId(req.params.menuId) || !validId(req.params.itemId)) {
      return res.status(400).json({ success: false, error: 'Tâche introuvable.' });
    }
    await changeCatalog(res, (roles) => (
      patchItem(roles, req.params.roleId, req.params.menuId, req.params.itemId, req.body || {})
    ));
  } catch (error) {
    console.error('work-posts patchItem', error);
    res.status(500).json({ success: false, error: 'Impossible de modifier la tâche.' });
  }
};

exports.deleteItem = async (req, res) => {
  try {
    if (refuseUnlessAdmin(req, res)) return;
    if (!validId(req.params.roleId) || !validId(req.params.menuId) || !validId(req.params.itemId)) {
      return res.status(400).json({ success: false, error: 'Tâche introuvable.' });
    }
    await changeCatalog(res, (roles) => removeItem(roles, req.params.roleId, req.params.menuId, req.params.itemId));
  } catch (error) {
    console.error('work-posts deleteItem', error);
    res.status(500).json({ success: false, error: 'Impossible de supprimer la tâche.' });
  }
};

exports.moveCatalog = async (req, res) => {
  try {
    if (refuseUnlessAdmin(req, res)) return;
    await changeCatalog(res, (roles) => moveCatalog(roles, req.body || {}));
  } catch (error) {
    console.error('work-posts moveCatalog', error);
    res.status(500).json({ success: false, error: 'Impossible de changer l’ordre.' });
  }
};
