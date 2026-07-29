const express = require('express');
const router = express.Router();
const { authenticateEmployee } = require('../middleware/auth');
const controller = require('../controllers/staffPrintMessageController');

router.use(authenticateEmployee);

router.get('/audiences', controller.listAudiences);
router.post('/', controller.createStaffMessage);

module.exports = router;
