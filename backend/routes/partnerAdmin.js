const express = require('express');
const router = express.Router();
const controller = require('../controllers/partnerCompanyController');
const { authenticateManager } = require('../middleware/auth');

router.post('/companies', authenticateManager, controller.adminCreateCompany);
router.post('/companies/:id/send-invite', authenticateManager, controller.adminSendInvite);
router.get('/companies', authenticateManager, controller.adminListCompanies);
router.delete('/companies/:id', authenticateManager, controller.adminDeleteCompany);

router.get('/orders', authenticateManager, controller.adminListOrders);
router.patch('/orders/:id/status', authenticateManager, controller.adminUpdateOrderStatus);

router.get('/formulas', authenticateManager, controller.adminGetFormulas);
router.put('/formulas', authenticateManager, controller.adminUpdateFormulas);

module.exports = router;

