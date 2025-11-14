// Middleware d'authentification pour les salariés
const authenticateEmployee = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    console.log('🔍 Header Authorization reçu:', authHeader ? 'présent' : 'absent');
    
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      console.log('❌ Aucun token trouvé dans le header Authorization');
      return res.status(401).json({
        success: false,
        error: 'Token d\'authentification requis'
      });
    }
    
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'votre-cle-secrete-ici');
    
    console.log('🔍 Token décodé:', { 
      role: decoded.role, 
      userId: decoded.userId, 
      employeeId: decoded.employeeId,
      id: decoded.id 
    });
    
    // Accepter à la fois 'employee' et 'admin' pour compatibilité
    if (decoded.role !== 'employee' && decoded.role !== 'admin') {
      console.log('❌ Rôle non autorisé:', decoded.role);
      return res.status(403).json({
        success: false,
        error: 'Accès non autorisé'
      });
    }
    
    // Ajouter les informations de l'utilisateur à req.user pour compatibilité
    // Gérer à la fois les tokens admin (userId) et employee (employeeId)
    const userId = decoded.employeeId || decoded.userId || decoded.id;
    
    req.user = {
      id: userId,
      email: decoded.email,
      name: decoded.name,
      role: decoded.role,
      employeeId: decoded.role === 'admin' ? null : userId
    };
    
    req.employeeId = decoded.role === 'admin' ? null : userId;
    req.employeeEmail = decoded.email;
    req.employeeName = decoded.name;
    
    next();
  } catch (error) {
    console.error('❌ Erreur authentification:', error);
    
    // Gérer spécifiquement l'expiration du token
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token expiré',
        expired: true,
        expiredAt: error.expiredAt
      });
    }
    
    // Autres erreurs (token invalide, etc.)
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
    
    // Gérer spécifiquement l'expiration du token
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token expiré',
        expired: true,
        expiredAt: error.expiredAt
      });
    }
    
    // Autres erreurs (token invalide, etc.)
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

