const express = require('express');
const router = express.Router();
const controller = require('../controllers/partnerCompanyController');
const { authenticatePartnerCompany } = require('../middleware/auth');

router.post('/login', controller.partnerLogin);
router.get('/me', authenticatePartnerCompany, controller.partnerMe);

module.exports = router;

