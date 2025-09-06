const express = require('express');
const router = express.Router();
const menuPermissionsController = require('../controllers/menuPermissionsController');

// Route pour récupérer les permissions de menu selon le rôle
router.get('/', menuPermissionsController.getMenuPermissions);

// Route pour récupérer toutes les permissions (admin seulement)
router.get('/all', menuPermissionsController.getAllMenuPermissions);

// Route pour mettre à jour une permission spécifique
router.put('/:id', menuPermissionsController.updateMenuPermission);

// Route pour mettre à jour toutes les permissions
router.put('/batch', menuPermissionsController.updateAllMenuPermissions);

// Route pour recréer les permissions par défaut
router.post('/recreate', menuPermissionsController.recreateDefaultPermissions);

module.exports = router;
