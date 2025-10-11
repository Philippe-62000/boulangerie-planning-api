const express = require('express');
const router = express.Router();
const onboardingOffboardingController = require('../controllers/onboardingOffboardingController');

// Routes pour les démarches administratives

// GET /api/onboarding-offboarding/employee/:employeeId - Récupérer les démarches d'un employé
router.get('/employee/:employeeId', onboardingOffboardingController.getByEmployeeId);

// POST /api/onboarding-offboarding - Créer ou mettre à jour les démarches
router.post('/', onboardingOffboardingController.createOrUpdate);

// GET /api/onboarding-offboarding - Récupérer toutes les démarches
router.get('/', onboardingOffboardingController.getAll);

// GET /api/onboarding-offboarding/pending-obligations - Récupérer les obligations légales en attente
router.get('/pending-obligations', onboardingOffboardingController.getPendingLegalObligations);

// DELETE /api/onboarding-offboarding/employee/:employeeId - Supprimer les démarches d'un employé
router.delete('/employee/:employeeId', onboardingOffboardingController.deleteByEmployeeId);

module.exports = router;

