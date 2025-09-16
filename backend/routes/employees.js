const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employeeController');

// Routes pour les employés
router.get('/', employeeController.getAllEmployees);
router.get('/:id', employeeController.getEmployeeById);
router.post('/', employeeController.createEmployee);
router.put('/:id', employeeController.updateEmployee);
router.patch('/:id/deactivate', employeeController.deactivateEmployee);
router.patch('/:id/reactivate', employeeController.reactivateEmployee);
router.patch('/:id/sick-leave', employeeController.declareSickLeave);
router.delete('/:id', employeeController.deleteEmployee);

// Route temporaire pour l'envoi de mot de passe (en attendant la résolution jsonwebtoken)
router.post('/send-password/:employeeId', employeeController.sendPasswordToEmployee);

// Route temporaire pour la connexion employé (sans JWT)
router.post('/login', employeeController.employeeLogin);

module.exports = router;

