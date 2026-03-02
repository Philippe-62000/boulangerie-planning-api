const express = require('express');
const router = express.Router();
const onlineOrdersController = require('../controllers/onlineOrdersController');
const googleOAuthController = require('../controllers/googleOAuthController');

router.get('/auth/google', googleOAuthController.initiateAuth);
router.get('/auth/google/callback', googleOAuthController.handleCallback);
router.get('/auth/status', googleOAuthController.getAuthStatus);
router.post('/auth/disconnect', googleOAuthController.disconnect);

router.get('/links', onlineOrdersController.getLinks);
router.post('/links', onlineOrdersController.addLink);
router.delete('/links/:id', onlineOrdersController.deleteLink);
router.put('/links/order', onlineOrdersController.updateLinksOrder);
router.get('/orders/day', onlineOrdersController.getOrdersForDay);
router.get('/orders/monthly-summary', onlineOrdersController.getMonthlySummary);
router.get('/sheets/:spreadsheetId/tabs', onlineOrdersController.getSheetTabs);

module.exports = router;
