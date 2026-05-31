const { connectDB } = require('../../../lib/mongodb');
const { getPublicBoard } = require('../../../lib/camarisService');
const { setCors, handleOptions } = require('../../../lib/http');

module.exports = async function handler(req, res) {
  setCors(res);
  if (handleOptions(req, res)) return;
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Méthode non autorisée' });
  }
  try {
    await connectDB();
    const data = await getPublicBoard();
    res.setHeader('Cache-Control', 'no-store, max-age=0');
    return res.status(200).json({ success: true, data });
  } catch (e) {
    console.error('camaris/public/board', e);
    return res.status(500).json({ success: false, error: 'Erreur chargement page Camaris' });
  }
};
