const express = require('express');
const router = express.Router();
const controller = require('../controllers/employeeMessageController');

router.get('/public', controller.getPublicMessages);

router.get('/', controller.getMessages);
router.post('/', controller.createMessage);
router.delete('/:id', controller.deleteMessage);

module.exports = router;

