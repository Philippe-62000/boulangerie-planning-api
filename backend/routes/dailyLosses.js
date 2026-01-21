const express = require('express');
const router = express.Router();
const dailyLossesController = require('../controllers/dailyLossesController');

// Récupérer ou créer une entrée pour une date donnée
router.get('/day', dailyLossesController.getOrCreateDailyLosses);

// Récupérer toutes les entrées pour un mois donné
router.get('/month', dailyLossesController.getMonthlyLosses);

// Récupérer les statistiques pour le dashboard
router.get('/dashboard', dailyLossesController.getDashboardStats);

// Mettre à jour une entrée quotidienne
router.put('/:id', dailyLossesController.updateDailyLosses);

module.exports = router;
