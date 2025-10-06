const express = require('express');
const router = express.Router();
const {
  addDelay,
  getEmployeeDelays,
  getAllDelays,
  deleteDelay
} = require('../controllers/delayController');

// Ajouter un retard
router.post('/', addDelay);

// Récupérer les retards d'un employé
router.get('/employee/:employeeId', getEmployeeDelays);

// Récupérer tous les retards
router.get('/', getAllDelays);

// Supprimer un retard
router.delete('/employee/:employeeId/:delayId', deleteDelay);

module.exports = router;


