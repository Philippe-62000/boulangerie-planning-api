const express = require('express');
const router = express.Router();
const employeeStatusController = require('../controllers/employeeStatusController');

// Récupérer l'état complet des salariés pour un mois/année
router.get('/', employeeStatusController.getEmployeeStatus);

module.exports = router;
