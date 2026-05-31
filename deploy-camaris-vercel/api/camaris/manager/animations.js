const { connectDB } = require('../../../lib/mongodb');
const { saveManagerAnimation } = require('../../../lib/camarisService');
const { authenticateCamarisManager } = require('../../../lib/auth');
const { setCors, handleOptions, parseBody } = require('../../../lib/http');

module.exports = async function handler(req, res) {
  setCors(res);
  if (handleOptions(req, res)) return;
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Méthode non autorisée' });
  }
  try {
    await connectDB();
    const manager = await authenticateCamarisManager(req);
    const data = await saveManagerAnimation(manager, parseBody(req));
    return res.status(200).json({ success: true, data });
  } catch (e) {
    console.error('camaris/manager/animations POST', e);
    const status = e.status || 500;
    return res.status(status).json({ success: false, error: e.message || 'Erreur enregistrement animation' });
  }
};
