const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Route de connexion
router.post('/login', authController.login);

// Route de vérification de token
router.post('/verify', authController.verifyToken);

// Route de déconnexion
router.post('/logout', authController.logout);

// Route pour récupérer la liste des utilisateurs (admin seulement)
router.get('/users', authController.getUsers);

module.exports = router;
