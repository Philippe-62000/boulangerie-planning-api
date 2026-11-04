const express = require('express');
const { authenticateEmployee } = require('../middleware/auth');
const controller = require('../controllers/serviceNoteController');

const router = express.Router();

router.use(authenticateEmployee);

router.get('/audiences', controller.listAudiences);
router.get('/mine', controller.listMine);
router.get('/mine/pending', controller.listPending);
router.post('/assign-employee', controller.assignEmployeeNotes);
router.get('/', controller.listNotes);
router.post('/', controller.createNote);
router.get('/:id', controller.getNote);
router.delete('/:id', controller.deleteNote);
router.post('/:id/assign', controller.assignToNote);
router.post('/:id/viewed', controller.markViewed);
router.post('/:id/sign', controller.signNote);

module.exports = router;
