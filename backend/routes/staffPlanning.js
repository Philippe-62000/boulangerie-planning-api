const express = require('express');
const { authenticateEmployee } = require('../middleware/auth');
const controller = require('../controllers/staffPlanningController');

const router = express.Router();

router.use(authenticateEmployee);

router.get('/settings', controller.getSettings);
router.put('/settings', controller.updateSettings);
router.get('/published', controller.getPublishedWeek);
router.get('/month-counters', controller.getMonthCounters);
router.get('/stats/:employeeId', controller.getEmployeeStats);
router.get('/month-recap', controller.getMonthRecap);
router.put('/reorder', controller.reorderEmployees);
router.get('/week/:year/:week', controller.getWeek);
router.put('/week/:year/:week/cell', controller.updateCell);
router.put('/week/:year/:week/holiday', controller.toggleHoliday);
router.post('/week/:year/:week/validate', controller.validateWeek);
router.post('/week/:year/:week/actual', controller.createActualWeek);
router.post('/week/:year/:week/actual/validate', controller.validateActualWeek);
router.post('/week/:year/:week/acknowledge', controller.acknowledgeWeek);
router.post('/week/:year/:week/send', controller.sendWeek);
router.post('/week/:year/:week/duplicate', controller.duplicateWeek);
router.post('/week/:year/:week/copy', controller.copyWeekRows);

module.exports = router;
