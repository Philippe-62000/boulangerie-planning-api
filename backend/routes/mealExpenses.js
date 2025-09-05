const express = require('express');
const router = express.Router();
const mealExpenseController = require('../controllers/mealExpenseController');

// Récupérer les frais repas pour un mois/année donné
router.get('/', mealExpenseController.getMealExpenses);

// Sauvegarder les frais repas pour un employé
router.post('/', mealExpenseController.saveMealExpenses);

// Sauvegarder tous les frais repas pour un mois/année (batch)
router.post('/batch', mealExpenseController.saveAllMealExpenses);

module.exports = router;

