const express = require('express');
const router = express.Router();
const planningController = require('../controllers/planningController');

// Routes pour les plannings
router.post('/generate', planningController.generatePlanning);
router.get('/:weekNumber/:year', planningController.getPlanningByWeek);
router.patch('/:planningId/validate', planningController.validatePlanning);
router.patch('/:planningId/realize', planningController.markAsRealized);
router.delete('/:weekNumber/:year', planningController.deletePlanningByWeek);

module.exports = router;

