const express = require('express');
const router = express.Router();
const kmExpenseController = require('../controllers/kmExpenseController');
const kmTripRequestController = require('../controllers/kmTripRequestController');
const { authenticateEmployee, authenticateManager } = require('../middleware/auth');

router.get('/destinations', authenticateEmployee, kmTripRequestController.getKmDestinations);
router.get('/requests/mine', authenticateEmployee, kmTripRequestController.listMyKmTripRequests);
router.get('/requests/pending-count', authenticateManager, kmTripRequestController.getPendingKmTripCount);
router.get('/requests', authenticateManager, kmTripRequestController.listPendingKmTripRequests);
router.post('/requests', authenticateEmployee, kmTripRequestController.createKmTripRequest);
router.patch('/requests/:id', authenticateManager, kmTripRequestController.updateKmTripRequest);
router.post('/requests/:id/validate', authenticateManager, kmTripRequestController.validateKmTripRequest);
router.post('/requests/:id/reject', authenticateManager, kmTripRequestController.rejectKmTripRequest);

router.get('/', kmExpenseController.getKmExpenses);
router.post('/', kmExpenseController.saveKmExpenses);
router.post('/batch', kmExpenseController.saveAllKmExpenses);
router.post('/reset', kmExpenseController.resetEmployeeKmData);

module.exports = router;
