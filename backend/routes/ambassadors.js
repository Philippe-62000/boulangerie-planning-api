const express = require('express');
const router = express.Router();
const ambassadorController = require('../controllers/ambassadorController');
const { authenticateEmployee } = require('../middleware/auth');

// Routes publiques (code vendeuse) pour tablette - SANS auth
router.get('/public/validate-vendeuse/:saleCode', ambassadorController.validateVendeuse);
router.get('/public/ambassadors', ambassadorController.getPublicAmbassadorCodes);
router.get('/public/ambassadors-list', ambassadorController.getPublicAmbassadorsList);
router.get('/public/clients', ambassadorController.getPublicClients);
router.get('/public/ambassadors/:code/clients', ambassadorController.getPublicClientsByAmbassador);
router.post('/public/clients', ambassadorController.createPublicClient);
router.put('/public/clients/:id', ambassadorController.updatePublicClientGift);

// Toutes les routes ci-dessous nécessitent une authentification (admin ou salarié)
router.use(authenticateEmployee);

// Ambassadeurs
router.get('/ambassadors', ambassadorController.getAmbassadors);
router.post('/ambassadors', ambassadorController.createAmbassador);
router.put('/ambassadors/:id', ambassadorController.updateAmbassador);
router.delete('/ambassadors/:id', ambassadorController.deleteAmbassador);

// Clients parrainés
router.get('/clients', ambassadorController.getAmbassadorClients);
router.post('/clients', ambassadorController.createAmbassadorClient);
router.put('/clients/:id', ambassadorController.updateAmbassadorClient);
router.delete('/clients/:id', ambassadorController.deleteAmbassadorClient);

module.exports = router;
