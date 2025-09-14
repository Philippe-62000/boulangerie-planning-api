const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Middleware d'authentification pour les salariés
const authenticateEmployee = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Token d\'authentification requis'
      });
    }
    
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'votre-cle-secrete-ici');
    
    if (decoded.role !== 'employee') {
      return res.status(403).json({
        success: false,
        error: 'Accès non autorisé'
      });
    }
    
    req.employeeId = decoded.employeeId;
    req.employeeEmail = decoded.email;
    req.employeeName = decoded.name;
    
    next();
  } catch (error) {
    console.error('❌ Erreur authentification:', error);
    res.status(401).json({
      success: false,
      error: 'Token invalide'
    });
  }
};

// Route pour envoyer un mot de passe à un salarié (admin seulement)
router.post('/send-password/:id', authController.sendPasswordToEmployee);

// Route de connexion pour les salariés
router.post('/employee-login', authController.employeeLogin);

// Route pour récupérer le profil de l'employé connecté
router.get('/employee-profile', authenticateEmployee, authController.getEmployeeProfile);

module.exports = router;