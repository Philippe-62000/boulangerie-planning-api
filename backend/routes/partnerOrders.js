const express = require('express');
const router = express.Router();
const controller = require('../controllers/partnerCompanyController');
const { authenticatePartnerCompany } = require('../middleware/auth');
const { authenticateEmployee } = require('../middleware/auth');

router.get('/formulas', authenticatePartnerCompany, controller.partnerGetFormulas);
router.get('/my', authenticatePartnerCompany, controller.listMyOrders);
router.post('/my', authenticatePartnerCompany, controller.createMyOrder);
router.delete('/my/:id', authenticatePartnerCompany, controller.deletePartnerOrderById);
router.post('/my/:id/reply', authenticatePartnerCompany, controller.replyMyOrderMessage);

// Internal (salariés/admin) for dashboard + listing (read-only)
router.get('/pending-count', authenticateEmployee, controller.internalPendingCount);
router.get('/internal', authenticateEmployee, controller.internalListOrders);
router.post('/internal/:id/message', authenticateEmployee, controller.sendInternalOrderMessage);
router.patch('/internal/:id/message-alert', authenticateEmployee, controller.dismissInternalOrderMessageAlert);
router.patch('/internal/:id/status', authenticateEmployee, controller.adminUpdateOrderStatus);
router.post('/internal/quick-invite', authenticateEmployee, controller.staffQuickInviteByEmail);
router.delete('/internal/:id', authenticateEmployee, controller.deletePartnerOrderById);

module.exports = router;

