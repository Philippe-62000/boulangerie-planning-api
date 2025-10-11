const express = require('express');
const router = express.Router();
const uniformController = require('../controllers/uniformController');

// Routes pour la gestion des tenues

// GET /api/uniforms/employee/:employeeId - Récupérer les tenues d'un employé
router.get('/employee/:employeeId', uniformController.getByEmployeeId);

// POST /api/uniforms - Ajouter une tenue
router.post('/', uniformController.addUniformItem);

// PATCH /api/uniforms/:employeeId/:itemId/return - Marquer une tenue comme retournée
router.patch('/:employeeId/:itemId/return', uniformController.returnUniformItem);

// GET /api/uniforms - Récupérer toutes les tenues
router.get('/', uniformController.getAll);

// GET /api/uniforms/pending-returns - Récupérer les retours en attente
router.get('/pending-returns', uniformController.getPendingReturns);

// DELETE /api/uniforms/:employeeId/:itemId - Supprimer une tenue
router.delete('/:employeeId/:itemId', uniformController.deleteUniformItem);

module.exports = router;

