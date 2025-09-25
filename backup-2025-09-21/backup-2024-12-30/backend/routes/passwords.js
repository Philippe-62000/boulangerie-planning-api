const express = require('express');
const router = express.Router();
const passwordController = require('../controllers/passwordController');

// Route pour mettre à jour un mot de passe
router.put('/update', passwordController.updatePassword);

// Route pour récupérer la liste des utilisateurs (sans mots de passe)
router.get('/users', passwordController.getUsers);

module.exports = router;
