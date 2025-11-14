const express = require('express');
const router = express.Router();
const primeController = require('../controllers/primeController');
const { authenticateEmployee } = require('../middleware/auth');

// Routes pour les primes (admin seulement)
router.get('/', authenticateEmployee, primeController.getPrimes);
router.post('/', authenticateEmployee, primeController.createPrime);
router.put('/:id', authenticateEmployee, primeController.updatePrime);
router.delete('/:id', authenticateEmployee, primeController.deletePrime);

// Routes pour les affectations
router.get('/assignments', authenticateEmployee, primeController.getPrimeAssignments);
router.get('/assignments/employee/:employeeId', authenticateEmployee, primeController.getEmployeePrimeAssignments);
router.post('/assignments', authenticateEmployee, primeController.savePrimeAssignments);

// Routes pour les calculs mensuels
router.get('/calculations', authenticateEmployee, primeController.getPrimeCalculations);
router.post('/calculations', authenticateEmployee, primeController.savePrimeCalculations);

// Route pour récupérer les primes d'un salarié pour un mois (pour l'impression)
router.get('/employee/:employeeId/month/:month/year/:year', authenticateEmployee, primeController.getEmployeePrimesForMonth);

module.exports = router;

