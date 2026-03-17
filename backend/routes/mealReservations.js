const express = require('express');
const router = express.Router();
const controller = require('../controllers/mealReservationsController');
const { authenticateEmployee, authenticateClientPro } = require('../middleware/auth');

// --- Routes publiques (bot) ---
router.get('/bot-data', controller.getBotData);

// --- Auth client pro (public) ---
router.post('/client-login', controller.clientProLogin);

// --- Routes client pro (authentifié) ---
router.get('/my-reservations', authenticateClientPro, controller.getMyReservations);
router.post('/reservations', authenticateClientPro, controller.createReservation);

// --- Routes admin (authentifié employé/admin) ---
router.use(authenticateEmployee);

router.get('/clients', controller.getClientsPro);
router.post('/clients', controller.createClientPro);
router.put('/clients/:id', controller.updateClientPro);
router.delete('/clients/:id', controller.deleteClientPro);

router.get('/produits', controller.getProduits);
router.post('/produits', controller.createProduit);
router.put('/produits/:id', controller.updateProduit);
router.delete('/produits/:id', controller.deleteProduit);
router.get('/types', controller.getProductTypes);
router.post('/types', controller.createProductType);
router.put('/types/:id', controller.updateProductType);
router.delete('/types/:id', controller.deleteProductType);
router.get('/formules', controller.getFormules);
router.post('/formules', controller.createFormule);
router.put('/formules/:id', controller.updateFormule);
router.delete('/formules/:id', controller.deleteFormule);

router.get('/reservations', controller.getReservations);
router.post('/reservations/admin', controller.createReservation);
router.put('/reservations/:id', controller.updateReservation);

module.exports = router;
