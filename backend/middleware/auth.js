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
    
    // Accepter à la fois 'employee' et 'admin' pour compatibilité
    if (decoded.role !== 'employee' && decoded.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Accès non autorisé'
      });
    }
    
    // Ajouter les informations de l'utilisateur à req.user pour compatibilité
    req.user = {
      id: decoded.employeeId || decoded.id,
      email: decoded.email,
      name: decoded.name,
      role: decoded.role,
      employeeId: decoded.employeeId || decoded.id
    };
    
    req.employeeId = decoded.employeeId || decoded.id;
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

// Middleware d'authentification pour les managers/admin
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
    
    // Accepter seulement 'admin' pour les routes manager
    if (decoded.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Accès réservé aux administrateurs'
      });
    }
    
    req.user = {
      id: decoded.id || decoded.employeeId,
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

module.exports = {
  authenticateEmployee,
  authenticateManager
};

