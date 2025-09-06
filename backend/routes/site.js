const express = require('express');
const router = express.Router();
const siteController = require('../controllers/siteController');

// Route pour récupérer les informations du site
router.get('/', siteController.getSite);

// Route pour mettre à jour les informations du site
router.put('/', siteController.updateSite);

module.exports = router;
