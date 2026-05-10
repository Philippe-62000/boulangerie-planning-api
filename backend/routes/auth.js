const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { getJwtSecret } = require('../utils/jwtSecret');

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
    
    try {
      const decoded = jwt.verify(token, getJwtSecret());
      
      console.log('🔍 Token décodé:', decoded);
      
      if (decoded.role !== 'employee') {
        return res.status(403).json({
          success: false,
          error: 'Accès non autorisé'
        });
      }
      
      // Ajouter les informations de l'employé à req.user pour compatibilité
      req.user = {
        id: decoded.employeeId,
        email: decoded.email,
        name: decoded.name,
        role: decoded.role
      };
      
      console.log('🔍 req.user créé:', req.user);
      
      req.employeeId = decoded.employeeId;
      req.employeeEmail = decoded.email;
      req.employeeName = decoded.name;
      
      next();
    } catch (jwtError) {
      // Distinguer les tokens expirés des autres erreurs
      if (jwtError.name === 'TokenExpiredError') {
        console.log('⏰ Token expiré:', jwtError.expiredAt);
        return res.status(401).json({
          success: false,
          error: 'Token expiré',
          expired: true,
          expiredAt: jwtError.expiredAt
        });
      } else if (jwtError.name === 'JsonWebTokenError') {
        console.log('❌ Token invalide:', jwtError.message);
        return res.status(401).json({
          success: false,
          error: 'Token invalide',
          expired: false
        });
      } else {
        console.error('❌ Erreur authentification:', jwtError);
        return res.status(401).json({
          success: false,
          error: 'Erreur d\'authentification',
          expired: false
        });
      }
    }
  } catch (error) {
    console.error('❌ Erreur authentification (catch général):', error);
    res.status(401).json({
      success: false,
      error: 'Erreur d\'authentification'
    });
  }
};

// Route pour envoyer un mot de passe à un salarié (admin seulement)
router.post('/send-password/:id', authController.sendPasswordToEmployee);

// Route de connexion pour les salariés
router.post('/login', authController.employeeLogin);

// Route de connexion pour les admins (interface React)
router.post('/admin-login', authController.adminLogin);

// Route de connexion pour les salariés (interface React)
router.post('/employee-login', authController.employeeLoginReact);

// Connexion par code vendeuse (3 chiffres) — JWT employé nominatif
router.post('/login-by-sale-code', authController.loginBySaleCode);

// Route pour récupérer le profil de l'employé connecté
router.get('/employee-profile', authenticateEmployee, authController.getEmployeeProfile);

// Route pour changer le mot de passe d'un salarié
router.post('/change-password', authenticateEmployee, authController.changePassword);

module.exports = router;