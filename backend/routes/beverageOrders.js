const express = require('express');
const router = express.Router();
const { authenticateEmployee } = require('../middleware/auth');
const controller = require('../controllers/beverageOrderController');

router.use(authenticateEmployee);

router.get('/current', controller.getCurrent);
router.get('/pack-config', controller.getPackConfig);
router.put('/pack-config', controller.savePackConfig);
router.post('/compare', controller.compareProposals);

router.post('/parse', (req, res, next) => {
  controller.uploadMiddleware(req, res, (err) => {
    if (err) return res.status(400).json({ success: false, error: err.message });
    return controller.parsePdf(req, res);
  });
});

router.get('/', controller.listProposals);
router.post('/', controller.saveProposal);
router.get('/:id', controller.getProposal);
router.delete('/:id', controller.deleteProposal);

module.exports = router;
