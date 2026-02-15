const express = require('express');
const router = express.Router();
const parametersController = require('../controllers/parametersController');

// Récupérer tous les paramètres
router.get('/', parametersController.getParameters);

// Récupérer le statut maintenance (pour affichage public)
router.get('/maintenance', parametersController.getMaintenanceStatus);

// Mettre à jour tous les paramètres (batch) - DOIT être avant /:id
router.put('/batch', parametersController.updateAllParameters);

// Créer de nouveaux paramètres KM - DOIT être avant /:id
router.post('/km', parametersController.createKmParameters);

// Mettre à jour un paramètre
router.put('/:id', parametersController.updateParameter);

module.exports = router;

