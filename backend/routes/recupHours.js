const express = require('express');
const router = express.Router();
const { authenticateEmployee } = require('../middleware/auth');
const recupHourController = require('../controllers/recupHourController');

router.use(authenticateEmployee);

router.get('/:employeeId/history', recupHourController.getRecupHistory);
router.get('/', recupHourController.getRecupHours);
router.post('/', recupHourController.saveRecupHours);

module.exports = router;


