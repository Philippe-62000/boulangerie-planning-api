const express = require('express');
const router = express.Router();
const { authenticateEmployee } = require('../middleware/auth');
const controller = require('../controllers/workPostController');
const catalog = require('../controllers/workPostCatalogController');
const missions = require('../controllers/workMissionController');

router.use(authenticateEmployee);

router.get('/missions/today', missions.listToday);
router.get('/missions/employees', missions.listEmployees);
router.get('/missions', missions.list);
router.post('/missions', missions.create);
router.put('/missions/:id/report', missions.report);
router.patch('/missions/:id/supervise', missions.supervise);
router.delete('/missions/:id', missions.remove);

router.get('/today', controller.getToday);
router.put('/today', controller.saveToday);
router.post('/today/validate', controller.validateToday);
router.post('/today/reopen', controller.reopenToday);
router.get('/admin', controller.listForAdmin);
router.get('/catalog', catalog.getCatalog);
router.post('/catalog/move', catalog.moveCatalog);
router.patch('/catalog/roles/:roleId', catalog.patchRole);
router.post('/catalog/roles/:roleId/menus', catalog.createMenu);
router.patch('/catalog/roles/:roleId/menus/:menuId', catalog.patchMenu);
router.post('/catalog/roles/:roleId/menus/:menuId/items', catalog.createItem);
router.patch('/catalog/roles/:roleId/menus/:menuId/items/:itemId', catalog.patchItem);
router.delete('/catalog/roles/:roleId/menus/:menuId/items/:itemId', catalog.deleteItem);

module.exports = router;
