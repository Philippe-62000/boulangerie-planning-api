const express = require('express');
const router = express.Router();
const { authenticateEmployee } = require('../middleware/auth');
const controller = require('../controllers/planningImperativeController');

router.use(authenticateEmployee);

router.get('/', controller.listPlanningImperatives);
router.post('/', controller.createPlanningImperative);
router.delete('/:id', controller.cancelPlanningImperative);

module.exports = router;
