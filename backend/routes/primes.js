const express = require('express');
const router = express.Router();
const primeController = require('../controllers/primeController');

// Routes pour les primes (admin seulement - pas d'authentification comme les autres routes admin)
router.get('/', primeController.getPrimes);
router.post('/', primeController.createPrime);
router.put('/:id', primeController.updatePrime);
router.delete('/:id', primeController.deletePrime);

// Routes pour les affectations
router.get('/assignments', primeController.getPrimeAssignments);
router.get('/assignments/employee/:employeeId', primeController.getEmployeePrimeAssignments);
router.post('/assignments', primeController.savePrimeAssignments);

// Routes pour les calculs mensuels
router.get('/calculations', primeController.getPrimeCalculations);
router.post('/calculations', primeController.savePrimeCalculations);

// Route pour récupérer les primes d'un salarié pour un mois (pour l'impression)
router.get('/employee/:employeeId/month/:month/year/:year', primeController.getEmployeePrimesForMonth);

module.exports = router;

