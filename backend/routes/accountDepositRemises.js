const express = require('express');
const router = express.Router();
const { authenticateManager } = require('../middleware/auth');
const ctrl = require('../controllers/accountDepositRemiseController');

router.get('/dashboard', authenticateManager, ctrl.getDashboardSummary);
router.put('/today/draft', authenticateManager, ctrl.upsertTodayDraft);
router.post('/today/finish', authenticateManager, ctrl.finishToday);
router.post('/today/resume', authenticateManager, ctrl.resumeToday);

module.exports = router;

