const express = require('express');
const router = express.Router();
const kmExpenseController = require('../controllers/kmExpenseController');

// Récupérer les frais KM pour un mois/année donné
router.get('/', kmExpenseController.getKmExpenses);

// Sauvegarder les frais KM pour un employé
router.post('/', kmExpenseController.saveKmExpenses);

// Sauvegarder tous les frais KM pour un mois/année (batch)
router.post('/batch', kmExpenseController.saveAllKmExpenses);

// Réinitialiser les données d'un employé spécifique
router.post('/reset', kmExpenseController.resetEmployeeKmData);

module.exports = router;

