const express = require('express');
const router = express.Router();
const emailTemplateController = require('../controllers/emailTemplateController');

// Routes pour les templates d'email
router.get('/', emailTemplateController.getAllEmailTemplates);
router.get('/:id', emailTemplateController.getEmailTemplateById);
router.post('/', emailTemplateController.createEmailTemplate);
router.put('/:id', emailTemplateController.updateEmailTemplate);
router.delete('/:id', emailTemplateController.deleteEmailTemplate);

// Route pour initialiser les templates par défaut
router.post('/initialize-defaults', emailTemplateController.initializeDefaultTemplates);

// Route pour tester un template
router.post('/:id/test', emailTemplateController.testEmailTemplate);

module.exports = router;
