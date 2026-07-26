const express = require('express');
const router = express.Router();
const controller = require('../controllers/partnerCompanyController');
const printController = require('../controllers/partnerOrderPrintController');
const { authenticatePartnerCompany } = require('../middleware/auth');
const { authenticateEmployee } = require('../middleware/auth');
const requireInternalApiSecret = require('../middleware/requireInternalApiSecret');
const requirePrintAgentKey = require('../middleware/requirePrintAgentKey');

router.get('/formulas', authenticatePartnerCompany, controller.partnerGetFormulas);
router.get('/my', authenticatePartnerCompany, controller.listMyOrders);
router.post('/my', authenticatePartnerCompany, controller.createMyOrder);
router.delete('/my/:id', authenticatePartnerCompany, controller.deletePartnerOrderById);
router.post('/my/:id/reply', authenticatePartnerCompany, controller.replyMyOrderMessage);
router.post('/my/:id/client-request', authenticatePartnerCompany, controller.requestMyOrderClientAction);

router.post('/internal-from-vercel', requireInternalApiSecret, controller.internalFromVercel);
router.post('/internal-client-request', requireInternalApiSecret, controller.internalClientRequestFromVercel);

// Agent d'impression des caisses (ticket à chaque nouvelle commande / demande client)
router.get('/print-queue', requirePrintAgentKey, printController.printQueue);
router.post('/print-queue/ack', requirePrintAgentKey, printController.printQueueAck);

// Internal (salariés/admin) for dashboard + listing (read-only)
router.get('/pending-count', authenticateEmployee, controller.internalPendingCount);
router.get('/internal', authenticateEmployee, controller.internalListOrders);
router.post('/internal/:id/message', authenticateEmployee, controller.sendInternalOrderMessage);
router.patch('/internal/:id/message-alert', authenticateEmployee, controller.dismissInternalOrderMessageAlert);
router.patch('/internal/:id/status', authenticateEmployee, controller.adminUpdateOrderStatus);
router.patch('/internal/:id/client-request', authenticateEmployee, controller.adminAcknowledgeClientRequest);
router.post('/internal/quick-invite', authenticateEmployee, controller.staffQuickInviteByEmail);
router.delete('/internal/:id', authenticateEmployee, controller.deletePartnerOrderById);

module.exports = router;

