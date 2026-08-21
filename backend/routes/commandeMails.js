const express = require('express');
const router = express.Router();
const { authenticateEmployee } = require('../middleware/auth');
const requireInternalApiSecret = require('../middleware/requireInternalApiSecret');
const ctrl = require('../controllers/commandeMailController');

/** n8n (Arras) — header x-internal-secret = INTERNAL_API_SECRET Render api-4 */
router.post('/from-n8n', requireInternalApiSecret, ctrl.fromN8n);

router.get('/', authenticateEmployee, ctrl.listMails);
router.get('/:id', authenticateEmployee, ctrl.getMail);
router.post('/:id/read', authenticateEmployee, ctrl.markRead);
router.post('/:id/print', authenticateEmployee, ctrl.printMail);
router.delete('/:id', authenticateEmployee, ctrl.removeMail);

module.exports = router;
