const jwt = require('jsonwebtoken');
const { getJwtSecret } = require('../utils/jwtSecret');
const CamarisManager = require('../models/CamarisManager');

const authenticateCamarisManager = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ success: false, error: 'Token requis' });
    }
    const decoded = jwt.verify(token, getJwtSecret());
    if (decoded.role !== 'camaris_manager') {
      return res.status(403).json({ success: false, error: 'Accès réservé aux managers Camaris' });
    }
    const manager = await CamarisManager.findById(decoded.managerId).select('+password');
    if (!manager || !manager.isActive) {
      return res.status(401).json({ success: false, error: 'Compte manager inactif' });
    }
    req.camarisManager = manager;
    req.camarisSiteKey = decoded.siteKey || 'lon';
    next();
  } catch (e) {
    if (e.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, error: 'Session expirée', expired: true });
    }
    return res.status(401).json({ success: false, error: 'Token invalide' });
  }
};

module.exports = { authenticateCamarisManager };
