const express = require('express');
const router = express.Router();
const controller = require('../controllers/partnerCompanyController');
const { authenticatePartnerCompany } = require('../middleware/auth');
const { authenticateEmployee } = require('../middleware/auth');

router.get('/formulas', authenticatePartnerCompany, controller.partnerGetFormulas);
router.get('/my', authenticatePartnerCompany, controller.listMyOrders);
router.post('/my', authenticatePartnerCompany, controller.createMyOrder);
router.delete('/my/:id', authenticatePartnerCompany, controller.deletePartnerOrderById);

// Internal (salariés/admin) for dashboard + listing (read-only)
router.get('/pending-count', authenticateEmployee, controller.internalPendingCount);
router.get('/internal', authenticateEmployee, controller.internalListOrders);
router.delete('/internal/:id', authenticateEmployee, controller.deletePartnerOrderById);

module.exports = router;

