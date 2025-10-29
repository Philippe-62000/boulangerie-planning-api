const express = require('express');
const router = express.Router();
const advanceRequestController = require('../controllers/advanceRequestController');

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
    
    // Ajouter les informations de l'employé à req.user pour compatibilité
    req.user = {
      id: decoded.employeeId,
      email: decoded.email,
      name: decoded.name,
      role: decoded.role
    };
    
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

// Middleware d'authentification pour les managers
const authenticateManager = async (req, res, next) => {
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
    
    if (!['manager', 'admin'].includes(decoded.role)) {
      return res.status(403).json({
        success: false,
        error: 'Accès non autorisé - Manager requis'
      });
    }
    
    req.user = {
      id: decoded.employeeId || decoded.userId,
      email: decoded.email,
      name: decoded.name,
      role: decoded.role
    };
    
    next();
  } catch (error) {
    console.error('❌ Erreur authentification manager:', error);
    res.status(401).json({
      success: false,
      error: 'Token invalide'
    });
  }
};

// Routes pour les salariés
router.post('/', authenticateEmployee, advanceRequestController.createAdvanceRequest);
router.get('/employee', authenticateEmployee, advanceRequestController.getEmployeeAdvanceRequests);

// Routes pour les managers
router.get('/', authenticateManager, advanceRequestController.getAllAdvanceRequests);
router.get('/pending', authenticateManager, advanceRequestController.getPendingRequests);
router.get('/stats', authenticateManager, advanceRequestController.getAdvanceStats);
router.put('/:id', authenticateManager, advanceRequestController.updateAdvanceRequest);
router.delete('/:id', authenticateManager, advanceRequestController.deleteAdvanceRequest);

module.exports = router;
