const express = require('express');
const router = express.Router();
const recupHourController = require('../controllers/recupHourController');

router.get('/:employeeId/history', recupHourController.getRecupHistory);
router.get('/', recupHourController.getRecupHours);
router.post('/', recupHourController.saveRecupHours);

module.exports = router;


