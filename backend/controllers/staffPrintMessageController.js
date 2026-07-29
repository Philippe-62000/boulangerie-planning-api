/**
 * Messages internes imprimés sur l'imprimante ticket des commandes (agent caisse).
 */
const StaffPrintMessage = require('../models/StaffPrintMessage');

const AUDIENCE_LABELS = {
  tous: 'Pour tous',
  vente: 'Pour la Vente',
  vendeuse_matin: 'Pour la vendeuse du matin',
  vendeuse_soir: 'Pour la vendeuse du soir',
  prepa: 'Pour les Prepa',
  boulangers: 'Pour les boulangers'
};

const siteMap = { lon: 'longuenesse', plan: 'arras' };
const normalizeSite = (s) => {
  const v = String(s || '').toLowerCase();
  return siteMap[v] || (v === 'arras' ? 'arras' : 'longuenesse');
};

function siteMatchQuery(site) {
  if (site === 'longuenesse') return { site: { $in: ['longuenesse', 'lon'] } };
  return { site: { $in: ['arras', 'plan'] } };
}

const createStaffMessage = async (req, res) => {
  try {
    const site = normalizeSite(req.body?.site || req.query?.site);
    const audience = String(req.body?.audience || '').trim();
    const message = String(req.body?.message || '').trim();

    if (!StaffPrintMessage.AUDIENCES.includes(audience)) {
      return res.status(400).json({
        success: false,
        error: 'Destinataire invalide'
      });
    }
    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'Le contenu du message est obligatoire'
      });
    }
    if (message.length > 4000) {
      return res.status(400).json({
        success: false,
        error: 'Message trop long (4000 caracteres max)'
      });
    }

    const user = req.user || {};
    const createdByName =
      req.employeeName ||
      user.name ||
      user.email ||
      'Equipe';

    const doc = await StaffPrintMessage.create({
      site,
      audience,
      message,
      createdByName,
      createdById: user.id || user.employeeId || null
    });

    res.json({
      success: true,
      data: {
        id: doc._id,
        audience,
        audienceLabel: AUDIENCE_LABELS[audience],
        site,
        createdAt: doc.createdAt
      },
      message:
        'Message enregistre. Il sera imprime sur l’imprimante des commandes sous environ une minute.'
    });
  } catch (err) {
    console.error('❌ createStaffMessage:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

const listAudiences = (req, res) => {
  res.json({
    success: true,
    data: StaffPrintMessage.AUDIENCES.map((id) => ({
      id,
      label: AUDIENCE_LABELS[id]
    }))
  });
};

module.exports = {
  createStaffMessage,
  listAudiences,
  AUDIENCE_LABELS,
  normalizeSite,
  siteMatchQuery
};
