const express = require('express');
const router = express.Router();
const menuPermissionsController = require('../controllers/menuPermissionsController');

// Route pour récupérer les permissions de menu selon le rôle
router.get('/', menuPermissionsController.getMenuPermissions);

// Route pour récupérer toutes les permissions (admin seulement)
router.get('/all', menuPermissionsController.getAllMenuPermissions);

// Route pour mettre à jour toutes les permissions (DOIT être avant /:id)
router.put('/batch', menuPermissionsController.updateAllMenuPermissions);

// Route pour recréer les permissions par défaut
router.post('/recreate', menuPermissionsController.recreateDefaultPermissions);

// Route pour forcer la création des permissions par défaut
router.post('/create-defaults', menuPermissionsController.createDefaultPermissions);

// Route pour mettre à jour une permission spécifique (DOIT être après /batch)
router.put('/:id', menuPermissionsController.updateMenuPermission);

module.exports = router;
