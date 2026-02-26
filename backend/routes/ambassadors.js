const express = require('express');
const multer = require('multer');
const router = express.Router();
const ambassadorController = require('../controllers/ambassadorController');
const { authenticateEmployee } = require('../middleware/auth');

const uploadExcel = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

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
router.post('/ambassadors/import-excel', uploadExcel.single('file'), ambassadorController.importAmbassadorsFromExcel);
// Template SMS (avant /:id pour éviter que "sms-template" soit pris comme id)
router.get('/ambassadors/sms-template', ambassadorController.getSmsTemplate);
router.put('/ambassadors/sms-template', ambassadorController.saveSmsTemplate);
// Prévisualiser SMS / Synchroniser blacklist
router.post('/ambassadors/preview-sms', ambassadorController.previewSmsToAmbassadors);
router.post('/ambassadors/sync-blacklist', ambassadorController.syncSmsBlacklist);
router.post('/ambassadors/send-sms', ambassadorController.sendSmsToAmbassadors);
router.put('/ambassadors/:id', ambassadorController.updateAmbassador);
router.delete('/ambassadors/:id', ambassadorController.deleteAmbassador);
router.post('/ambassadors/:id/regenerate-code', ambassadorController.regenerateAmbassadorCode);
router.post('/ambassadors/:id/resend-sms', ambassadorController.resendSmsAmbassador);

// Clients parrainés
router.get('/clients', ambassadorController.getAmbassadorClients);
router.post('/clients', ambassadorController.createAmbassadorClient);
router.put('/clients/:id', ambassadorController.updateAmbassadorClient);
router.delete('/clients/:id', ambassadorController.deleteAmbassadorClient);
router.post('/clients/:id/regenerate-coupon', ambassadorController.regenerateCoupon);

module.exports = router;
