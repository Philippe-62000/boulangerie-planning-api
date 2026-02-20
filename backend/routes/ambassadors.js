const express = require('express');
const router = express.Router();
const ambassadorController = require('../controllers/ambassadorController');
const { authenticateEmployee } = require('../middleware/auth');

// Toutes les routes nécessitent une authentification (admin ou salarié)
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
