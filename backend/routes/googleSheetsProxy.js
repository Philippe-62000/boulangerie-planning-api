const express = require('express');
const router = express.Router();
const googleSheetsProxyController = require('../controllers/googleSheetsProxyController');

/**
 * @route   GET /api/google-sheets-proxy
 * @desc    Récupère les données d'une feuille Google Sheets
 * @query   sheetId - ID de la feuille Google Sheets
 * @query   month - Nom de l'onglet (mois)
 * @access  Public
 */
router.get('/', googleSheetsProxyController.fetchSheet);

module.exports = router;


