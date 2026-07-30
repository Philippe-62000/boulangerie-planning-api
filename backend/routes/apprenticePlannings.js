const express = require('express');
const router = express.Router();
const { authenticateEmployee } = require('../middleware/auth');
const controller = require('../controllers/apprenticePlanningController');

router.use(authenticateEmployee);

router.get('/', controller.listPlannings);
router.get('/global', controller.getGlobalView);
router.post('/manual', controller.saveManualDates);
router.post('/', (req, res, next) => {
  controller.uploadMiddleware(req, res, (err) => {
    if (err) return res.status(400).json({ success: false, error: err.message });
    return controller.uploadPlanning(req, res);
  });
});
router.put('/:id/dates', controller.updateTrainingDates);
router.get('/:id/download', controller.downloadPlanning);
router.delete('/:id', controller.deletePlanning);

module.exports = router;
