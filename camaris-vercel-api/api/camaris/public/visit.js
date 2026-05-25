const { connectDB } = require('../../../lib/mongodb');
const { recordVisit, getVisitCount } = require('../../../lib/camarisService');
const { setCors, handleOptions } = require('../../../lib/http');

module.exports = async function handler(req, res) {
  setCors(res);
  if (handleOptions(req, res)) return;
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Méthode non autorisée' });
  }
  try {
    await connectDB();
    const totalVisits = await recordVisit();
    return res.status(200).json({ success: true, data: { totalVisits } });
  } catch (e) {
    console.error('camaris/public/visit', e);
    try {
      const totalVisits = await getVisitCount();
      return res.status(200).json({ success: true, data: { totalVisits } });
    } catch {
      return res.status(500).json({ success: false, error: 'Erreur compteur visites' });
    }
  }
};
