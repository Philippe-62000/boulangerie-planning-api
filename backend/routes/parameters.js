const express = require('express');
const router = express.Router();
const parametersController = require('../controllers/parametersController');

// Récupérer tous les paramètres
router.get('/', parametersController.getParameters);

// Mettre à jour un paramètre
router.put('/:id', parametersController.updateParameter);

// Mettre à jour tous les paramètres (batch)
router.put('/batch', parametersController.updateAllParameters);

module.exports = router;

