const express = require('express');
const router = express.Router();
const maintenanceController = require('../controllers/maintenanceController');

// Vérifier les mises à jour de sécurité et dépendances
router.get('/security-check', maintenanceController.checkSecurityUpdates);

// Obtenir les informations système
router.get('/system-info', maintenanceController.getSystemInfo);

module.exports = router;

