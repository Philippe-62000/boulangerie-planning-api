const express = require('express');
const router = express.Router();

const stocksController = require('../controllers/stocksController');
const { authenticateManager } = require('../middleware/auth');

// Farines - config (public en lecture pour les pages stand-alone)
router.get('/flours/config', stocksController.getFlourConfig);

// Farines - inventaire (public en lecture pour dashboard / stand-alone)
router.get('/flours/inventory', stocksController.getFlourInventory);

// Farines - saisie stand-alone (public)
router.post('/flours/entry', stocksController.postFlourEntry);

// Admin: mise à jour batch config
router.put('/flours/config', authenticateManager, stocksController.putFlourConfigBatch);

// Admin: proposition commande
router.post('/flours/order-proposal', authenticateManager, stocksController.postOrderProposal);

module.exports = router;

