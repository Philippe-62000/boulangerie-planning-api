const express = require('express');
const router = express.Router();
const { authenticateEmployee } = require('../middleware/auth');
const ctrl = require('../controllers/accountDepositRemiseController');

// Utilisée par l'intranet (admin) ET par la page standalone (vendeuse).
// authenticateEmployee accepte aussi les tokens admin.
router.get('/dashboard', authenticateEmployee, ctrl.getDashboardSummary);
router.put('/today/draft', authenticateEmployee, ctrl.upsertTodayDraft);
router.post('/today/finish', authenticateEmployee, ctrl.finishToday);
router.post('/today/resume', authenticateEmployee, ctrl.resumeToday);

module.exports = router;

