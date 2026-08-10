const { getJwtSecret } = require('../utils/jwtSecret');

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
    const decoded = jwt.verify(token, getJwtSecret());
    
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
    
    // ID salarié réel (fiche Employee) — pas le userId du compte générique "salarie" React
    const employeeId =
      decoded.employeeId != null ? String(decoded.employeeId) : null;
    const userId =
      employeeId ||
      (decoded.userId != null ? String(decoded.userId) : null) ||
      (decoded.id != null ? String(decoded.id) : null);

    // Uniquement pour les tokens liés à une fiche Employee (salarie-connexion / code vendeuse)
    // Le token générique React « Salarié » n'a que userId (User) : ne pas le traiter comme Employee
    if (decoded.role === 'employee' && employeeId) {
      const Employee = require('../models/Employee');
      const employee = await Employee.findById(employeeId).select('isActive name email');
      if (!employee) {
        return res.status(401).json({
          success: false,
          error: 'Token invalide (employé introuvable)',
          invalidToken: true
        });
      }
      if (employee.isActive === false) {
        return res.status(401).json({
          success: false,
          error: 'Compte salarié désactivé',
          deactivated: true
        });
      }
    }
    
    req.user = {
      id: userId,
      email: decoded.email,
      name: decoded.name,
      role: decoded.role,
      employeeId: decoded.role === 'admin' ? null : (employeeId || userId)
    };
    req.saleCode = typeof decoded.saleCode === 'string' ? decoded.saleCode : undefined;
    
    req.employeeId = decoded.role === 'admin' ? null : (employeeId || userId);
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
    const decoded = jwt.verify(token, getJwtSecret());
    
    // Accepter seulement 'admin' pour les routes manager
    if (decoded.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Accès réservé aux administrateurs'
      });
    }
    
    req.user = {
      id: decoded.userId || decoded.id || decoded.employeeId,
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

// Middleware d'authentification pour les clients pro (plateaux repas)
const authenticateClientPro = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ success: false, error: 'Token requis' });
    }
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, getJwtSecret());
    if (decoded.role !== 'client_pro') {
      return res.status(403).json({ success: false, error: 'Accès non autorisé' });
    }
    req.clientProId = decoded.clientProId;
    req.clientProLogin = decoded.login;
    req.clientProSite = decoded.site;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, error: 'Token expiré', expired: true });
    }
    res.status(401).json({ success: false, error: 'Token invalide' });
  }
};

// Middleware d'authentification pour les entreprises partenaires (commandes petits-déjeuners/déjeuners)
const authenticatePartnerCompany = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ success: false, error: 'Token requis' });
    }
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, getJwtSecret());
    if (decoded.role !== 'partner_company') {
      return res.status(403).json({ success: false, error: 'Accès non autorisé' });
    }
    req.partnerCompanyId = decoded.companyId;
    req.partnerCompanyEmail = decoded.email;
    req.partnerCompanyName = decoded.name;
    req.partnerCompanyContactName = decoded.contactName || '';
    req.partnerCompanyMealTypesMode = decoded.mealTypesMode || 'both';
    req.partnerCompanySite = decoded.site;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, error: 'Token expiré', expired: true });
    }
    res.status(401).json({ success: false, error: 'Token invalide' });
  }
};

module.exports = {
  authenticateEmployee,
  authenticateManager,
  authenticateClientPro,
  authenticatePartnerCompany
};

