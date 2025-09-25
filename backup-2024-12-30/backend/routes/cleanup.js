const express = require('express');
const router = express.Router();
const cleanupController = require('../controllers/cleanupController');

// Nettoyer les arrêts maladie expirés
router.post('/expired-sick-leaves', cleanupController.cleanExpiredSickLeaves);

module.exports = router;
