const { connectDB } = require('../../../lib/mongodb');
const { managerLogin } = require('../../../lib/camarisService');
const { setCors, handleOptions, parseBody } = require('../../../lib/http');

module.exports = async function handler(req, res) {
  setCors(res);
  if (handleOptions(req, res)) return;
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Méthode non autorisée' });
  }
  try {
    await connectDB();
    const result = await managerLogin(parseBody(req));
    return res.status(200).json({ success: true, ...result });
  } catch (e) {
    console.error('camaris/manager/login', e);
    const status = e.status || 500;
    return res.status(status).json({ success: false, error: e.message || 'Erreur connexion manager' });
  }
};
