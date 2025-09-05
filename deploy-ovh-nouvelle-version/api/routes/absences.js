const express = require('express');
const router = express.Router();
const absenceController = require('../controllers/absenceController');

// Déclarer une absence
router.post('/', absenceController.declareAbsence);

// Obtenir les statistiques d'absences
router.get('/stats', absenceController.getAbsenceStats);

// Obtenir toutes les absences
router.get('/', absenceController.getAllAbsences);

// Supprimer une absence
router.delete('/:id', absenceController.deleteAbsence);

module.exports = router;



