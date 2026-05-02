const express = require('express');
const router = express.Router();
const controller = require('../controllers/partnerCompanyController');
const { authenticateManager } = require('../middleware/auth');

/** Purge définitive par e-mail (POST — évite 404 si DELETE /companies n’est pas exposé) */
router.post('/companies/purge', authenticateManager, controller.adminPurgePartnerCompanyByEmailPost);
router.post('/companies', authenticateManager, controller.adminCreateCompany);
/** Compat. DELETE /companies ?email=&permanent=true */
router.delete('/companies', authenticateManager, controller.adminPurgePartnerCompanyByEmail);
router.delete('/companies/:id', authenticateManager, controller.adminDeleteCompany);
router.post('/companies/:id/send-invite', authenticateManager, controller.adminSendInvite);
router.get('/companies', authenticateManager, controller.adminListCompanies);

router.get('/orders', authenticateManager, controller.adminListOrders);
router.patch('/orders/:id/status', authenticateManager, controller.adminUpdateOrderStatus);

router.get('/formulas', authenticateManager, controller.adminGetFormulas);
router.put('/formulas', authenticateManager, controller.adminUpdateFormulas);

module.exports = router;

