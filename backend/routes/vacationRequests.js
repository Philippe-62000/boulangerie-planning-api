const express = require('express');
const router = express.Router();
const vacationRequestController = require('../controllers/vacationRequestController');

// Routes pour les demandes de congés
router.get('/', vacationRequestController.getAllVacationRequests);
router.get('/:id', vacationRequestController.getVacationRequestById);
router.post('/', vacationRequestController.createVacationRequest);
router.put('/:id', vacationRequestController.updateVacationRequest);
router.patch('/:id', vacationRequestController.updateVacationRequest);
router.patch('/:id/validate', vacationRequestController.validateVacationRequest);
router.patch('/:id/accept', vacationRequestController.validateVacationRequest);
router.patch('/:id/reject', vacationRequestController.rejectVacationRequest);

// Route pour forcer la synchronisation des congés
router.post('/sync-employees', vacationRequestController.syncVacationsWithEmployees);

module.exports = router;
