const { connectDB } = require('../../../lib/mongodb');
const { getManagerWeek } = require('../../../lib/camarisService');
const { authenticateCamarisManager } = require('../../../lib/auth');
const { setCors, handleOptions } = require('../../../lib/http');

module.exports = async function handler(req, res) {
  setCors(res);
  if (handleOptions(req, res)) return;
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Méthode non autorisée' });
  }
  try {
    await connectDB();
    await authenticateCamarisManager(req);
    const data = await getManagerWeek(req.query?.weekKey);
    return res.status(200).json({ success: true, data });
  } catch (e) {
    console.error('camaris/manager/week', e);
    const status = e.status || 500;
    return res.status(status).json({ success: false, error: e.message || 'Erreur chargement semaine' });
  }
};
