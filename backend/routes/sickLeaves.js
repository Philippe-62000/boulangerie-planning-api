const express = require('express');
const router = express.Router();
const sickLeaveController = require('../controllers/sickLeaveController');

// Route publique pour l'upload d'arrêt maladie (salariés)
router.post('/upload', 
  sickLeaveController.uploadMiddleware,
  sickLeaveController.uploadSickLeave
);

// Routes protégées (admin uniquement)
// Récupérer tous les arrêts maladie
router.get('/', sickLeaveController.getAllSickLeaves);

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

module.exports = router;
