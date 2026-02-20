const Ambassador = require('../models/Ambassador');
const AmbassadorClient = require('../models/AmbassadorClient');
const Employee = require('../models/Employee');

// Enrichir les clients avec les noms vendeuses (quand seul saleCode est stocké)
const enrichClientsWithNames = async (clients) => {
  const saleCodes = [...new Set(
    clients.flatMap(c => {
      const arr = [];
      if (c.recordedBySaleCode && !c.recordedByName) arr.push(c.recordedBySaleCode);
      if (c.giftClaimedBySaleCode && !c.giftClaimedByName) arr.push(c.giftClaimedBySaleCode);
      if (c.giftReceivedBySaleCode && !c.giftReceivedByName) arr.push(c.giftReceivedBySaleCode);
      return arr;
    })
  )];
  if (saleCodes.length === 0) return clients;
  const employees = await Employee.find({ saleCode: { $in: saleCodes } }).select('saleCode name');
  const map = Object.fromEntries(employees.map(e => [String(e.saleCode), e.name]));
  return clients.map(c => {
    const obj = c.toObject ? c.toObject() : { ...c };
    if (obj.recordedBySaleCode && !obj.recordedByName) obj.recordedByName = map[String(obj.recordedBySaleCode)] || obj.recordedBySaleCode;
    if (obj.giftClaimedBySaleCode && !obj.giftClaimedByName) obj.giftClaimedByName = map[String(obj.giftClaimedBySaleCode)] || obj.giftClaimedBySaleCode;
    if (obj.giftReceivedBySaleCode && !obj.giftReceivedByName) obj.giftReceivedByName = map[String(obj.giftReceivedBySaleCode)] || obj.giftReceivedBySaleCode;
    return obj;
  });
};

// Liste des ambassadeurs (avec nombre de clients parrainés)
const getAmbassadors = async (req, res) => {
  try {
    const ambassadors = await Ambassador.find().sort({ lastName: 1, firstName: 1 });
    const counts = await AmbassadorClient.aggregate([
      { $group: { _id: '$ambassadorCode', count: { $sum: 1 } } }
    ]);
    const countMap = Object.fromEntries(counts.map(x => [x._id, x.count]));
    const data = ambassadors.map(a => ({
      ...a.toObject(),
      clientsCount: countMap[a.code] || 0
    }));
    res.json({ success: true, data });
  } catch (error) {
    console.error('Erreur getAmbassadors:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

// Créer un ambassadeur
const createAmbassador = async (req, res) => {
  try {
    const { firstName, lastName, phone, email } = req.body;
    if (!firstName?.trim() || !lastName?.trim() || !phone?.trim()) {
      return res.status(400).json({ success: false, error: 'Nom, prénom et téléphone requis' });
    }
    const ambassador = await Ambassador.create({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: phone.trim(),
      email: (email || '').trim()
    });
    res.status(201).json({ success: true, data: ambassador });
  } catch (error) {
    console.error('Erreur createAmbassador:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

// Modifier un ambassadeur
const updateAmbassador = async (req, res) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, phone, email } = req.body;
    const ambassador = await Ambassador.findByIdAndUpdate(
      id,
      {
        ...(firstName !== undefined && { firstName: firstName.trim() }),
        ...(lastName !== undefined && { lastName: lastName.trim() }),
        ...(phone !== undefined && { phone: phone.trim() }),
        ...(email !== undefined && { email: email.trim() })
      },
      { new: true }
    );
    if (!ambassador) {
      return res.status(404).json({ success: false, error: 'Ambassadeur introuvable' });
    }
    res.json({ success: true, data: ambassador });
  } catch (error) {
    console.error('Erreur updateAmbassador:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

// Supprimer un ambassadeur
const deleteAmbassador = async (req, res) => {
  try {
    const { id } = req.params;
    const ambassador = await Ambassador.findByIdAndDelete(id);
    if (!ambassador) {
      return res.status(404).json({ success: false, error: 'Ambassadeur introuvable' });
    }
    res.json({ success: true, message: 'Ambassadeur supprimé' });
  } catch (error) {
    console.error('Erreur deleteAmbassador:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

// Liste des clients parrainés
const getAmbassadorClients = async (req, res) => {
  try {
    const clients = await AmbassadorClient.find()
      .populate('ambassadorId', 'firstName lastName code phone email')
      .sort({ createdAt: -1 });
    const enriched = await enrichClientsWithNames(clients);
    res.json({ success: true, data: enriched });
  } catch (error) {
    console.error('Erreur getAmbassadorClients:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

// Créer un client parrainé
const createAmbassadorClient = async (req, res) => {
  try {
    const { firstName, lastName, phone, ambassadorCode } = req.body;
    if (!firstName?.trim() || !lastName?.trim() || !phone?.trim() || !ambassadorCode?.trim()) {
      return res.status(400).json({ success: false, error: 'Nom, prénom, téléphone et code ambassadeur requis' });
    }
    const ambassador = await Ambassador.findOne({ code: ambassadorCode.trim().toUpperCase() });
    if (!ambassador) {
      return res.status(400).json({ success: false, error: 'Code ambassadeur invalide' });
    }
    const client = await AmbassadorClient.create({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: phone.trim(),
      ambassadorCode: ambassadorCode.trim().toUpperCase(),
      ambassadorId: ambassador._id
    });
    const populated = await AmbassadorClient.findById(client._id)
      .populate('ambassadorId', 'firstName lastName code phone email');
    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    console.error('Erreur createAmbassadorClient:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

// Modifier un client parrainé
const updateAmbassadorClient = async (req, res) => {
  try {
    const { id } = req.params;
    const { giftReceived, giftClaimed } = req.body;
    const client = await AmbassadorClient.findByIdAndUpdate(
      id,
      {
        ...(typeof giftReceived === 'boolean' && { giftReceived }),
        ...(typeof giftClaimed === 'boolean' && { giftClaimed })
      },
      { new: true }
    ).populate('ambassadorId', 'firstName lastName code phone email');
    if (!client) {
      return res.status(404).json({ success: false, error: 'Client introuvable' });
    }
    res.json({ success: true, data: client });
  } catch (error) {
    console.error('Erreur updateAmbassadorClient:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

// --- Routes publiques (code vendeuse) pour tablette ---

const validateSaleCode = async (saleCode) => {
  if (!saleCode?.trim()) return null;
  const employee = await Employee.findOne({ saleCode: saleCode.trim(), isActive: true })
    .select('_id name saleCode');
  return employee;
};

// Liste des codes ambassadeurs (pour autocomplete)
const getPublicAmbassadorCodes = async (req, res) => {
  try {
    const ambassadors = await Ambassador.find().select('code').sort({ code: 1 });
    res.json({ success: true, data: ambassadors.map(a => a.code) });
  } catch (error) {
    console.error('Erreur getPublicAmbassadorCodes:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

// Liste des clients parrainés (public)
const getPublicClients = async (req, res) => {
  try {
    const clients = await AmbassadorClient.find()
      .populate('ambassadorId', 'firstName lastName code phone email')
      .sort({ createdAt: -1 });
    const enriched = await enrichClientsWithNames(clients);
    res.json({ success: true, data: enriched });
  } catch (error) {
    console.error('Erreur getPublicClients:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

// Créer un client parrainé (public, avec saleCode)
const createPublicClient = async (req, res) => {
  try {
    const { firstName, lastName, phone, ambassadorCode, saleCode } = req.body;
    const employee = await validateSaleCode(saleCode);
    if (!employee) {
      return res.status(401).json({ success: false, error: 'Code vendeuse invalide ou inactif' });
    }
    if (!firstName?.trim() || !lastName?.trim() || !phone?.trim() || !ambassadorCode?.trim()) {
      return res.status(400).json({ success: false, error: 'Nom, prénom, téléphone et code ambassadeur requis' });
    }
    const ambassador = await Ambassador.findOne({ code: ambassadorCode.trim().toUpperCase() });
    if (!ambassador) {
      return res.status(400).json({ success: false, error: 'Code ambassadeur invalide' });
    }
    const client = await AmbassadorClient.create({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: phone.trim(),
      ambassadorCode: ambassadorCode.trim().toUpperCase(),
      ambassadorId: ambassador._id,
      recordedBySaleCode: employee.saleCode,
      recordedByName: employee.name
    });
    const populated = await AmbassadorClient.findById(client._id)
      .populate('ambassadorId', 'firstName lastName code phone email');
    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    console.error('Erreur createPublicClient:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

// Mettre à jour cadeau retiré/bénéficié (public, avec saleCode)
const updatePublicClientGift = async (req, res) => {
  try {
    const { id } = req.params;
    const { giftReceived, giftClaimed, saleCode } = req.body;
    const employee = await validateSaleCode(saleCode);
    if (!employee) {
      return res.status(401).json({ success: false, error: 'Code vendeuse invalide ou inactif' });
    }
    const update = {};
    if (typeof giftReceived === 'boolean') {
      update.giftReceived = giftReceived;
      update.giftReceivedBySaleCode = giftReceived ? employee.saleCode : null;
      update.giftReceivedByName = giftReceived ? employee.name : null;
    }
    if (typeof giftClaimed === 'boolean') {
      update.giftClaimed = giftClaimed;
      update.giftClaimedBySaleCode = giftClaimed ? employee.saleCode : null;
      update.giftClaimedByName = giftClaimed ? employee.name : null;
    }
    const client = await AmbassadorClient.findByIdAndUpdate(id, update, { new: true })
      .populate('ambassadorId', 'firstName lastName code phone email');
    if (!client) {
      return res.status(404).json({ success: false, error: 'Client introuvable' });
    }
    res.json({ success: true, data: client });
  } catch (error) {
    console.error('Erreur updatePublicClientGift:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

// Supprimer un client parrainé
const deleteAmbassadorClient = async (req, res) => {
  try {
    const { id } = req.params;
    const client = await AmbassadorClient.findByIdAndDelete(id);
    if (!client) {
      return res.status(404).json({ success: false, error: 'Client introuvable' });
    }
    res.json({ success: true, message: 'Client supprimé' });
  } catch (error) {
    console.error('Erreur deleteAmbassadorClient:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

module.exports = {
  getAmbassadors,
  createAmbassador,
  updateAmbassador,
  deleteAmbassador,
  getAmbassadorClients,
  createAmbassadorClient,
  updateAmbassadorClient,
  deleteAmbassadorClient,
  getPublicAmbassadorCodes,
  getPublicClients,
  createPublicClient,
  updatePublicClientGift
};
