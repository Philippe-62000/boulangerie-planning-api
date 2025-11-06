const express = require('express');
const router = express.Router();
const employeeStatusController = require('../controllers/employeeStatusController');

// Récupérer l'état complet des salariés pour un mois/année
router.get('/', employeeStatusController.getEmployeeStatus);

// Créer ou mettre à jour un trop perçu
router.put('/overpayment', employeeStatusController.upsertEmployeeOverpayment);

module.exports = router;

