const express = require('express');
const router = express.Router();

const stocksController = require('../controllers/stocksController');
const { authenticateManager } = require('../middleware/auth');

// Farines - config (public en lecture pour les pages stand-alone)
router.get('/flours/config', stocksController.getFlourConfig);

// Farines - inventaire (public en lecture pour dashboard / stand-alone)
router.get('/flours/inventory', stocksController.getFlourInventory);

// Farines - stock théorique (déduction conso/j) + rappel inventaire physique
router.get('/flours/status', stocksController.getFlourStocksStatus);

// Farines - saisie stand-alone (public)
router.post('/flours/entry', stocksController.postFlourEntry);

// Admin: mise à jour batch config
router.put('/flours/config', authenticateManager, stocksController.putFlourConfigBatch);

// Ouverture dimanche (7j/7) — paramètre site, pas par farine
router.put('/flours/site-settings', authenticateManager, stocksController.putFlourSiteSettings);

// Admin: historique des envois salariés
router.get('/flours/entries', authenticateManager, stocksController.getFlourEntries);
router.get('/flours/entries/:entryId', authenticateManager, stocksController.getFlourEntryById);
router.delete('/flours/entries/:entryId', authenticateManager, stocksController.deleteFlourEntry);

// Admin: proposition commande
router.post('/flours/order-proposal', authenticateManager, stocksController.postOrderProposal);

module.exports = router;

