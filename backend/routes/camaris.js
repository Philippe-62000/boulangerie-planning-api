const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/camarisController');
const { authenticateCamarisManager } = require('../middleware/camarisManagerAuth');

router.get('/public/board', ctrl.getPublicBoard);

router.post('/manager/login', ctrl.managerLogin);
router.get('/manager/week', authenticateCamarisManager, ctrl.getManagerWeek);
router.post('/manager/animations', authenticateCamarisManager, ctrl.saveManagerAnimation);
router.put('/manager/animations/:id', authenticateCamarisManager, ctrl.saveManagerAnimation);
router.delete('/manager/animations/:id', authenticateCamarisManager, ctrl.deleteManagerAnimation);

router.get('/admin/managers', ctrl.authenticateManagerAdmin, ctrl.listManagersAdmin);
router.post('/admin/managers', ctrl.authenticateManagerAdmin, ctrl.createManagerAdmin);
router.put('/admin/managers/:id', ctrl.authenticateManagerAdmin, ctrl.updateManagerAdmin);
router.delete('/admin/managers/:id', ctrl.authenticateManagerAdmin, ctrl.deleteManagerAdmin);

router.get('/admin/visit-stats', ctrl.authenticateManagerAdmin, ctrl.getVisitStatsAdmin);

router.get('/admin/territory-events', ctrl.authenticateManagerAdmin, ctrl.listTerritoryEventsAdmin);
router.post('/admin/territory-events', ctrl.authenticateManagerAdmin, ctrl.saveTerritoryEventAdmin);
router.put('/admin/territory-events/:id', ctrl.authenticateManagerAdmin, ctrl.saveTerritoryEventAdmin);
router.delete('/admin/territory-events/:id', ctrl.authenticateManagerAdmin, ctrl.deleteTerritoryEventAdmin);

module.exports = router;
