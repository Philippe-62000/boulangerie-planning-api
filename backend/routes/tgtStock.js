const express = require('express');
const router = express.Router();
const { authenticateEmployee } = require('../middleware/auth');
const ctrl = require('../controllers/tgtStockController');

router.get('/config', authenticateEmployee, ctrl.getConfig);
router.put('/config', authenticateEmployee, ctrl.putConfig);

router.get('/products', authenticateEmployee, ctrl.getProductsForEntry);
router.post('/entry', authenticateEmployee, ctrl.postEntry);

router.get('/entries', authenticateEmployee, ctrl.getEntries);
router.get('/entries/:entryId', authenticateEmployee, ctrl.getEntryById);

router.get('/status', ctrl.getStatus);

module.exports = router;
