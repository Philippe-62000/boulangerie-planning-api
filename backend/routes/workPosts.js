const express = require('express');
const router = express.Router();
const { authenticateEmployee } = require('../middleware/auth');
const controller = require('../controllers/workPostController');

router.use(authenticateEmployee);

router.get('/today', controller.getToday);
router.put('/today', controller.saveToday);
router.post('/today/validate', controller.validateToday);
router.post('/today/reopen', controller.reopenToday);
router.get('/admin', controller.listForAdmin);

module.exports = router;
