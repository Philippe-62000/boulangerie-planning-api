const express = require('express');
const router = express.Router();
const mutuelleController = require('../controllers/mutuelleController');

// Route publique pour l'upload de justificatif mutuelle (salariés)
router.post('/upload', 
  mutuelleController.uploadMiddleware,
  mutuelleController.uploadMutuelle
);

// Obtenir les statistiques
router.get('/stats', mutuelleController.getStats);

// Obtenir la liste des employés avec leur statut mutuelle (pour impression)
router.get('/employees-list', mutuelleController.getEmployeesList);

// Récupérer tous les justificatifs mutuelle
router.get('/', mutuelleController.getAllMutuelle);

// Récupérer un justificatif par ID
router.get('/:id', mutuelleController.getMutuelleById);

// Télécharger un fichier
router.get('/:id/download', mutuelleController.downloadFile);

// Valider un justificatif mutuelle
router.put('/:id/validate', mutuelleController.validateMutuelle);

// Rejeter un justificatif mutuelle
router.put('/:id/reject', mutuelleController.rejectMutuelle);

// Supprimer un justificatif mutuelle
router.delete('/:id', mutuelleController.deleteMutuelle);

module.exports = router;

