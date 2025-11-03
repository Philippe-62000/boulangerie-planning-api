const express = require('express');
const router = express.Router();
const dailySalesController = require('../controllers/dailySalesController');

// Route publique pour la saisie quotidienne (page autonome)
router.post('/submit', dailySalesController.submitDailySales);

// Routes pour les stats hebdomadaires (nécessitent une authentification)
router.get('/weekly', dailySalesController.getWeeklyStats);
router.get('/objectives', dailySalesController.getWeeklyObjectives);
router.post('/objectives', dailySalesController.setWeeklyObjectives);

module.exports = router;




