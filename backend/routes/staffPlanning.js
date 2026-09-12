const express = require('express');
const { authenticateEmployee } = require('../middleware/auth');
const controller = require('../controllers/staffPlanningController');

const router = express.Router();

router.use(authenticateEmployee);

router.get('/settings', controller.getSettings);
router.put('/settings', controller.updateSettings);
router.get('/month-counters', controller.getMonthCounters);
router.get('/stats/:employeeId', controller.getEmployeeStats);
router.get('/week/:year/:week', controller.getWeek);
router.put('/week/:year/:week/cell', controller.updateCell);
router.put('/week/:year/:week/holiday', controller.toggleHoliday);
router.post('/week/:year/:week/validate', controller.validateWeek);
router.post('/week/:year/:week/send', controller.sendWeek);
router.post('/week/:year/:week/duplicate', controller.duplicateWeek);
router.post('/week/:year/:week/copy', controller.copyWeekRows);

module.exports = router;
