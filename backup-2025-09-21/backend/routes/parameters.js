const express = require('express');
const router = express.Router();
const parametersController = require('../controllers/parametersController');

// Récupérer tous les paramètres
router.get('/', parametersController.getParameters);

// Mettre à jour tous les paramètres (batch) - DOIT être avant /:id
router.put('/batch', parametersController.updateAllParameters);

// Mettre à jour un paramètre
router.put('/:id', parametersController.updateParameter);

module.exports = router;

