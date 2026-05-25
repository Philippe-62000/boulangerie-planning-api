const { connectDB } = require('../../../lib/mongodb');
const { recordVisit } = require('../../../lib/camarisService');
const { getVisitSummary } = require('../../../lib/visitStats');
const { setCors, handleOptions } = require('../../../lib/http');

module.exports = async function handler(req, res) {
  setCors(res);
  if (handleOptions(req, res)) return;
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Méthode non autorisée' });
  }
  try {
    await connectDB();
    const visits = await recordVisit();
    return res.status(200).json({ success: true, data: { visits } });
  } catch (e) {
    console.error('camaris/public/visit', e);
    try {
      const visits = await getVisitSummary();
      return res.status(200).json({ success: true, data: { visits } });
    } catch {
      return res.status(500).json({ success: false, error: 'Erreur compteur visites' });
    }
  }
};
