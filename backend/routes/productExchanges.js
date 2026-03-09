const express = require('express');
const router = express.Router();
const productExchangeController = require('../controllers/productExchangeController');

// Partenaires
router.get('/partners', productExchangeController.getPartners);
router.post('/partners', productExchangeController.createPartner);
router.put('/partners/:id', productExchangeController.updatePartner);
router.delete('/partners/:id', productExchangeController.deletePartner);

// Site actuel
router.get('/current-site', productExchangeController.getCurrentSite);

// Échanges
router.get('/', productExchangeController.getExchanges);
router.post('/', productExchangeController.createExchange);
router.put('/:id', productExchangeController.updateExchange);
router.delete('/:id', productExchangeController.deleteExchange);

module.exports = router;
