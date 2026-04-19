const express = require('express');
const router = express.Router();
const { authenticateEmployee } = require('../middleware/auth');
const c = require('../controllers/accountClientPresetController');

router.get('/', authenticateEmployee, c.list);
router.post('/', authenticateEmployee, c.create);
router.patch('/:id', authenticateEmployee, c.update);
router.delete('/:id', authenticateEmployee, c.remove);

module.exports = router;
