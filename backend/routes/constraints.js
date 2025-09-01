const express = require('express');
const router = express.Router();
const constraintsController = require('../controllers/constraintsController');

// Routes pour les contraintes
router.post('/', constraintsController.upsertConstraints);
router.get('/:weekNumber/:year', constraintsController.getConstraintsByWeek);
router.get('/employee/:employeeId', constraintsController.getConstraintsByEmployee);
router.delete('/:weekNumber/:year/:employeeId', constraintsController.deleteConstraints);
router.post('/global', constraintsController.applyGlobalConstraint);

module.exports = router;

