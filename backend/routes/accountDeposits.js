const express = require('express');
const router = express.Router();
const { authenticateEmployee, authenticateManager } = require('../middleware/auth');
const accountDepositController = require('../controllers/accountDepositController');

router.post('/', authenticateEmployee, accountDepositController.create);
router.get('/', authenticateManager, accountDepositController.list);
router.patch('/:id', authenticateManager, accountDepositController.updateStatus);
router.delete('/:id', authenticateManager, accountDepositController.remove);

module.exports = router;
