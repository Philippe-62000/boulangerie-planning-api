const express = require('express');
const router = express.Router();
const { authenticateEmployee } = require('../middleware/auth');
const requireInternalApiSecret = require('../middleware/requireInternalApiSecret');
const ctrl = require('../controllers/auditSanitaireController');

/** n8n (Arras) — header x-internal-secret = INTERNAL_API_SECRET Render api-4 */
router.post('/from-n8n', requireInternalApiSecret, ctrl.fromN8n);

router.get('/pending', authenticateEmployee, ctrl.listPending);
router.get('/history', authenticateEmployee, ctrl.listHistory);
router.post('/:id/printed', authenticateEmployee, ctrl.markPrinted);

module.exports = router;
