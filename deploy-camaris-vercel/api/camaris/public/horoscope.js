const { setCors, handleOptions } = require('../../../lib/http');
const { fetchHoroscope } = require('../../../lib/horoscope');

module.exports = async function handler(req, res) {
  setCors(res);
  if (handleOptions(req, res)) return;
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Méthode non autorisée' });
  }
  try {
    const sign = req.query?.sign;
    const data = await fetchHoroscope(sign);
    res.setHeader('Cache-Control', 'no-store, max-age=0');
    return res.status(200).json({ success: true, data });
  } catch (e) {
    console.error('camaris/public/horoscope', e);
    const status = e.status || 500;
    return res.status(status).json({ success: false, error: e.message || 'Erreur horoscope' });
  }
};
