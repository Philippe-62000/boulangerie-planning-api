const express = require('express');
const router = express.Router();
const sickLeaveController = require('../controllers/sickLeaveController');

// Routes protégées (admin uniquement)
// Récupérer tous les arrêts maladie
router.get('/', sickLeaveController.getAllSickLeaves);

// Test de connexion SFTP (doit être avant /:id pour éviter les conflits)
router.get('/test-sftp', sickLeaveController.testSftpConnection);

// Test d'upload simple
router.get('/test-upload', sickLeaveController.testUpload);

// Test de configuration email
router.get('/test-email', sickLeaveController.testEmailConfiguration);

// Route publique pour l'upload d'arrêt maladie (salariés)
router.post('/upload', 
  sickLeaveController.uploadMiddleware,
  sickLeaveController.uploadSickLeave
);

// Récupérer un arrêt maladie par ID
router.get('/:id', sickLeaveController.getSickLeaveById);

// Télécharger un fichier
router.get('/:id/download', sickLeaveController.downloadFile);

// Valider un arrêt maladie
router.put('/:id/validate', sickLeaveController.validateSickLeave);

// Rejeter un arrêt maladie
router.put('/:id/reject', sickLeaveController.rejectSickLeave);

// Marquer comme déclaré
router.put('/:id/declare', sickLeaveController.markAsDeclared);

// Obtenir les statistiques
router.get('/stats/overview', sickLeaveController.getStats);

// Supprimer un arrêt maladie
router.delete('/:id', sickLeaveController.deleteSickLeave);

// Supprimer tous les arrêts maladie (admin uniquement)
router.delete('/all', sickLeaveController.deleteAllSickLeaves);

module.exports = router;
