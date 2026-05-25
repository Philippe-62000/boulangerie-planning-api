const jwt = require('jsonwebtoken');
const { getJwtSecret } = require('./jwtSecret');
const { CamarisManager } = require('./models');

async function authenticateCamarisManager(req) {
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!token) {
    const err = new Error('Token requis');
    err.status = 401;
    throw err;
  }
  try {
    const decoded = jwt.verify(token, getJwtSecret());
    if (decoded.role !== 'camaris_manager') {
      const err = new Error('Accès réservé aux managers Camaris');
      err.status = 403;
      throw err;
    }
    const manager = await CamarisManager.findById(decoded.managerId);
    if (!manager || !manager.isActive) {
      const err = new Error('Compte manager inactif');
      err.status = 401;
      throw err;
    }
    return manager;
  } catch (e) {
    if (e.status) throw e;
    if (e.name === 'TokenExpiredError') {
      const err = new Error('Session expirée');
      err.status = 401;
      err.expired = true;
      throw err;
    }
    const err = new Error('Token invalide');
    err.status = 401;
    throw err;
  }
}

function signManagerToken(manager) {
  return jwt.sign(
    {
      role: 'camaris_manager',
      managerId: String(manager._id),
      siteKey: 'lon',
      login: manager.login
    },
    getJwtSecret(),
    { expiresIn: '12h' }
  );
}

module.exports = { authenticateCamarisManager, signManagerToken };
