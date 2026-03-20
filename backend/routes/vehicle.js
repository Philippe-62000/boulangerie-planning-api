const express = require('express');
const router = express.Router();
const vehicleController = require('../controllers/vehicleController');

router.get('/drivers', vehicleController.listDrivers);
router.get('/config', vehicleController.getConfig);
router.put('/config', vehicleController.putConfig);
router.get('/trips', vehicleController.listTrips);
router.get('/stats', vehicleController.getStats);
router.post('/trips', vehicleController.startTrip);
router.put('/trips/:id/return', vehicleController.completeReturn);

module.exports = router;
