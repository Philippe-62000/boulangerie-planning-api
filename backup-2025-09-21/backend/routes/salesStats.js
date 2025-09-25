const express = require('express');
const router = express.Router();
const salesStatsController = require('../controllers/salesStatsController');

// Route pour sauvegarder les statistiques de vente
router.post('/', salesStatsController.saveSalesStats);

// Route pour obtenir les statistiques d'une période spécifique
router.get('/period/:month/:year', salesStatsController.getSalesStatsForPeriod);

// Route pour obtenir les statistiques mensuelles agrégées d'une année
router.get('/monthly/:year', salesStatsController.getMonthlyStatsForYear);

// Route pour obtenir le classement des employés pour une période
router.get('/ranking/:month/:year', salesStatsController.getEmployeeRanking);

// Route pour obtenir toutes les statistiques
router.get('/all', salesStatsController.getAllSalesStats);

// Route pour supprimer les statistiques d'une période
router.delete('/:month/:year', salesStatsController.deleteSalesStats);

module.exports = router;
