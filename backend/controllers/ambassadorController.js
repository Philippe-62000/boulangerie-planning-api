const Ambassador = require('../models/Ambassador');
const AmbassadorClient = require('../models/AmbassadorClient');
const Employee = require('../models/Employee');
const Parameter = require('../models/Parameters');
const smsService = require('../services/smsService');

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
    const [countsById, countsByCode, giftsRetiredById, giftsRetiredByCode] = await Promise.all([
      AmbassadorClient.aggregate([
        { $match: { ambassadorId: { $exists: true, $ne: null } } },
        { $group: { _id: '$ambassadorId', count: { $sum: 1 } } }
      ]),
      AmbassadorClient.aggregate([
        { $match: { ambassadorCode: { $exists: true, $ne: null, $ne: '' } } },
        { $group: { _id: '$ambassadorCode', count: { $sum: 1 } } }
      ]),
      AmbassadorClient.aggregate([
        { $match: { ambassadorId: { $exists: true, $ne: null }, giftClaimed: true } },
        { $group: { _id: '$ambassadorId', count: { $sum: 1 } } }
      ]),
      AmbassadorClient.aggregate([
        { $match: { ambassadorCode: { $exists: true, $ne: null, $ne: '' }, giftClaimed: true } },
        { $group: { _id: '$ambassadorCode', count: { $sum: 1 } } }
      ])
    ]);
    const countById = Object.fromEntries(countsById.map(x => [String(x._id), x.count]));
    const countByCode = Object.fromEntries(countsByCode.map(x => [String(x._id).toUpperCase(), x.count]));
    const giftsById = Object.fromEntries(giftsRetiredById.map(x => [String(x._id), x.count]));
    const giftsByCode = Object.fromEntries(giftsRetiredByCode.map(x => [String(x._id).toUpperCase(), x.count]));
    const data = ambassadors.map(a => ({
      ...a.toObject(),
      clientsCount: countById[a._id.toString()] ?? countByCode[(a.code || '').toUpperCase()] ?? 0,
      giftsRetiredCount: giftsById[a._id.toString()] ?? giftsByCode[(a.code || '').toUpperCase()] ?? 0
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
    const { firstName, lastName, phone, email, couponValidityDays } = req.body;
    if (!firstName?.trim() || !lastName?.trim() || !phone?.trim()) {
      return res.status(400).json({ success: false, error: 'Nom, prénom et téléphone requis' });
    }
    const days = couponValidityDays != null ? Math.max(1, parseInt(couponValidityDays, 10) || 30) : 30;
    const ambassador = await Ambassador.create({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: phone.trim(),
      email: (email || '').trim(),
      couponValidityDays: days
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
    const { firstName, lastName, phone, email, smsSent, smsOptOut } = req.body;
    const ambassador = await Ambassador.findByIdAndUpdate(
      id,
      {
        ...(firstName !== undefined && { firstName: firstName.trim() }),
        ...(lastName !== undefined && { lastName: lastName.trim() }),
        ...(phone !== undefined && { phone: phone.trim() }),
        ...(email !== undefined && { email: email.trim() }),
        ...(typeof smsSent === 'boolean' && { smsSent }),
        ...(typeof smsOptOut === 'boolean' && { smsOptOut })
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
    const validityDays = ambassador.couponValidityDays || 30;
    const couponExpiresAt = new Date();
    couponExpiresAt.setDate(couponExpiresAt.getDate() + validityDays);
    const client = await AmbassadorClient.create({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: phone.trim(),
      ambassadorCode: ambassadorCode.trim().toUpperCase(),
      ambassadorId: ambassador._id,
      couponExpiresAt
    });
    const populated = await AmbassadorClient.findById(client._id)
      .populate('ambassadorId', 'firstName lastName code phone email couponValidityDays');
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

// Valider code vendeuse et retourner le nom (pour affichage)
const validateVendeuse = async (req, res) => {
  try {
    const { saleCode } = req.params;
    const employee = await validateSaleCode(saleCode);
    if (!employee) {
      return res.json({ success: false, error: 'Code invalide ou inactif' });
    }
    res.json({ success: true, name: employee.name });
  } catch (error) {
    console.error('Erreur validateVendeuse:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
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

// Liste des ambassadeurs avec nom (pour recherche)
const getPublicAmbassadorsList = async (req, res) => {
  try {
    const ambassadors = await Ambassador.find()
      .select('firstName lastName code')
      .sort({ lastName: 1, firstName: 1 });
    const [countsById, countsByCode, giftsById, giftsByCode] = await Promise.all([
      AmbassadorClient.aggregate([
        { $match: { ambassadorId: { $exists: true, $ne: null } } },
        { $group: { _id: '$ambassadorId', count: { $sum: 1 } } }
      ]),
      AmbassadorClient.aggregate([
        { $match: { ambassadorCode: { $exists: true, $ne: null, $ne: '' } } },
        { $group: { _id: '$ambassadorCode', count: { $sum: 1 } } }
      ]),
      AmbassadorClient.aggregate([
        { $match: { ambassadorId: { $exists: true, $ne: null }, giftClaimed: true } },
        { $group: { _id: '$ambassadorId', count: { $sum: 1 } } }
      ]),
      AmbassadorClient.aggregate([
        { $match: { ambassadorCode: { $exists: true, $ne: null, $ne: '' }, giftClaimed: true } },
        { $group: { _id: '$ambassadorCode', count: { $sum: 1 } } }
      ])
    ]);
    const countById = Object.fromEntries(countsById.map(x => [String(x._id), x.count]));
    const countByCode = Object.fromEntries(countsByCode.map(x => [String(x._id).toUpperCase(), x.count]));
    const giftsRetiredById = Object.fromEntries(giftsById.map(x => [String(x._id), x.count]));
    const giftsRetiredByCode = Object.fromEntries(giftsByCode.map(x => [String(x._id).toUpperCase(), x.count]));
    const data = ambassadors.map(a => ({
      _id: a._id,
      firstName: a.firstName,
      lastName: a.lastName,
      code: a.code,
      fullName: `${a.firstName} ${a.lastName}`,
      clientsCount: countById[a._id.toString()] ?? countByCode[(a.code || '').toUpperCase()] ?? 0,
      giftsRetiredCount: giftsRetiredById[a._id.toString()] ?? giftsRetiredByCode[(a.code || '').toUpperCase()] ?? 0
    }));
    res.json({ success: true, data });
  } catch (error) {
    console.error('Erreur getPublicAmbassadorsList:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

// Clients par ambassadeur (public, pour onglet Ambassadeur)
const getPublicClientsByAmbassador = async (req, res) => {
  try {
    const { code } = req.params;
    if (!code?.trim()) {
      return res.status(400).json({ success: false, error: 'Code ambassadeur requis' });
    }
    const clients = await AmbassadorClient.find({ ambassadorCode: code.trim().toUpperCase() })
      .populate('ambassadorId', 'firstName lastName code phone email')
      .sort({ createdAt: -1 });
    const enriched = await enrichClientsWithNames(clients);
    res.json({ success: true, data: enriched });
  } catch (error) {
    console.error('Erreur getPublicClientsByAmbassador:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

// Liste des clients parrainés (public, avec recherche par nom)
const getPublicClients = async (req, res) => {
  try {
    const { search } = req.query;
    const filter = {};
    if (search && typeof search === 'string' && search.trim()) {
      const q = search.trim();
      filter.$or = [
        { firstName: { $regex: q, $options: 'i' } },
        { lastName: { $regex: q, $options: 'i' } }
      ];
    }
    const clients = await AmbassadorClient.find(filter)
      .populate('ambassadorId', 'firstName lastName code phone email couponValidityDays')
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
    const validityDays = ambassador.couponValidityDays || 30;
    const couponExpiresAt = new Date();
    couponExpiresAt.setDate(couponExpiresAt.getDate() + validityDays);
    const client = await AmbassadorClient.create({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: phone.trim(),
      ambassadorCode: ambassadorCode.trim().toUpperCase(),
      ambassadorId: ambassador._id,
      recordedBySaleCode: employee.saleCode,
      recordedByName: employee.name,
      couponExpiresAt
    });
    const populated = await AmbassadorClient.findById(client._id)
      .populate('ambassadorId', 'firstName lastName code phone email couponValidityDays');
    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    console.error('Erreur createPublicClient:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

// Mettre à jour cadeau retiré/bénéficié (public, avec saleCode)
// La vendeuse ne peut QUE cocher (pas décocher) - une fois retiré, c'est définitif
const updatePublicClientGift = async (req, res) => {
  try {
    const { id } = req.params;
    const { giftReceived, giftClaimed, saleCode } = req.body;
    const employee = await validateSaleCode(saleCode);
    if (!employee) {
      return res.status(401).json({ success: false, error: 'Code vendeuse invalide ou inactif' });
    }
    const current = await AmbassadorClient.findById(id);
    if (!current) return res.status(404).json({ success: false, error: 'Client introuvable' });
    const update = {};
    if (typeof giftReceived === 'boolean' && giftReceived === true) {
      update.giftReceived = true;
      update.giftReceivedBySaleCode = employee.saleCode;
      update.giftReceivedByName = employee.name;
    }
    if (typeof giftClaimed === 'boolean' && giftClaimed === true) {
      update.giftClaimed = true;
      update.giftClaimedBySaleCode = employee.saleCode;
      update.giftClaimedByName = employee.name;
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

// Template par défaut du SMS (signature : SMS_SIGNATURE > STORE_NAME > Ange Arras)
const getDefaultSmsTemplate = () => {
  const signature = process.env.SMS_SIGNATURE || process.env.STORE_NAME || 'Ange Arras';
  return `Félicitations {{firstName}} ! Voici un code Parrainage : code {{code}}. 3 pains pour vous, 1 pain pour le filleul à chaque carte créée. ${signature}`;
};

// Récupérer le template stocké (ou null si non défini)
const getStoredSmsTemplate = async () => {
  const param = await Parameter.findOne({ name: 'smsTemplate' });
  return param?.stringValue?.trim() || null;
};

// Obtenir le template effectif (stocké > default)
const getEffectiveSmsTemplate = async (overrideParam) => {
  if (overrideParam && overrideParam.trim()) return overrideParam.trim();
  const stored = await getStoredSmsTemplate();
  return stored || getDefaultSmsTemplate();
};

// Construire le message à partir du template
const buildMessageFromTemplate = (template, firstName, code) => {
  return (template || getDefaultSmsTemplate())
    .replace(/\{\{firstName\}\}/g, firstName || '')
    .replace(/\{\{code\}\}/g, code || '');
};

// Récupérer le template SMS stocké
const getSmsTemplate = async (req, res) => {
  try {
    const stored = await getStoredSmsTemplate();
    res.json({
      success: true,
      data: {
        template: stored || getDefaultSmsTemplate(),
        isCustom: !!stored
      }
    });
  } catch (error) {
    console.error('Erreur getSmsTemplate:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

// Enregistrer le template SMS
const saveSmsTemplate = async (req, res) => {
  try {
    const { messageTemplate } = req.body || {};
    const template = messageTemplate?.trim() || '';
    await Parameter.findOneAndUpdate(
      { name: 'smsTemplate' },
      { name: 'smsTemplate', displayName: 'Modèle SMS ambassadeurs', stringValue: template, kmValue: -1 },
      { upsert: true, new: true }
    );
    res.json({
      success: true,
      data: { template: template || getDefaultSmsTemplate(), saved: !!template }
    });
  } catch (error) {
    console.error('Erreur saveSmsTemplate:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

// Prévisualiser le SMS (retourne message exemple + infos caractères)
const previewSmsToAmbassadors = async (req, res) => {
  try {
    const { messageTemplate } = req.body || {};
    const template = await getEffectiveSmsTemplate(messageTemplate);

    const ambassadors = await Ambassador.find({
      smsSent: { $ne: true },
      smsOptOut: { $ne: true },
      phone: { $exists: true, $ne: null, $regex: /\S/ }
    })
      .sort({ lastName: 1, firstName: 1 })
      .limit(3);

    const previews = ambassadors.map(a => {
      const msg = buildMessageFromTemplate(template, a.firstName, a.code || '');
      const withStop = msg + (msg.toUpperCase().includes('STOP') ? '' : ' STOP');
      return {
        ambassador: `${a.firstName} ${a.lastName}`,
        phone: a.phone,
        message: withStop,
        charCount: withStop.length,
        smsCount: Math.ceil(withStop.length / 160) || 1
      };
    });

    const sampleMsg = buildMessageFromTemplate(template, 'Jean', 'AMB-XXXXXX');
    const sampleWithStop = sampleMsg + (sampleMsg.toUpperCase().includes('STOP') ? '' : ' STOP');

    res.json({
      success: true,
      data: {
        template,
        defaultTemplate: getDefaultSmsTemplate(),
        storedTemplate: await getStoredSmsTemplate(),
        sampleMessage: sampleWithStop,
        sampleCharCount: sampleWithStop.length,
        singleSmsLimit: 160,
        maxBeforeStop: 155,
        previews
      }
    });
  } catch (error) {
    console.error('Erreur previewSmsToAmbassadors:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

// Envoyer un SMS de bienvenue uniquement aux ambassadeurs qui ne l'ont pas encore reçu
const sendSmsToAmbassadors = async (req, res) => {
  try {
    if (!smsService.isConfigured()) {
      return res.status(503).json({
        success: false,
        error: 'Service SMS non configuré. Configurez OVH_APP_KEY, OVH_APP_SECRET et OVH_CONSUMER_KEY.'
      });
    }

    const { messageTemplate } = req.body || {};
    const template = await getEffectiveSmsTemplate(messageTemplate);

    const ambassadors = await Ambassador.find({
      smsSent: { $ne: true },
      smsOptOut: { $ne: true }
    })
      .sort({ lastName: 1, firstName: 1 });

    const items = ambassadors
      .filter(a => a.phone?.trim())
      .map(a => ({
        ambassadorId: a._id.toString(),
        phone: a.phone.trim(),
        message: buildMessageFromTemplate(template, a.firstName, a.code || '')
      }));

    if (items.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Aucun ambassadeur sans SMS envoyé (ou sans numéro de téléphone, ou ayant répondu STOP)'
      });
    }

    const { sent, failed, details } = await smsService.sendBulkSms(items);

    // Marquer smsSent = true pour les ambassadeurs qui ont reçu le SMS
    const sentIds = details
      .filter(d => d.status === 'ok')
      .map(d => items.find(i => i.phone === d.phone)?.ambassadorId)
      .filter(Boolean);
    if (sentIds.length > 0) {
      await Ambassador.updateMany({ _id: { $in: sentIds } }, { smsSent: true });
    }

    res.json({
      success: true,
      data: {
        total: items.length,
        sent,
        failed,
        details
      }
    });
  } catch (error) {
    console.error('Erreur sendSmsToAmbassadors:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

// Régénérer le code d'un ambassadeur et optionnellement renvoyer le SMS
const regenerateAmbassadorCode = async (req, res) => {
  try {
    const { id } = req.params;
    const { resendSms } = req.body;

    const ambassador = await Ambassador.findById(id);
    if (!ambassador) {
      return res.status(404).json({ success: false, error: 'Ambassadeur introuvable' });
    }

    const oldCode = ambassador.code;
    const generateCode = () => {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      let code = 'AMB-';
      for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return code;
    };
    let newCode = generateCode();
    let exists = await Ambassador.findOne({ code: newCode, _id: { $ne: id } });
    let attempts = 0;
    while (exists && attempts < 10) {
      newCode = generateCode();
      exists = await Ambassador.findOne({ code: newCode, _id: { $ne: id } });
      attempts++;
    }

    ambassador.code = newCode;
    await ambassador.save();

    // Mettre à jour les clients parrainés avec l'ancien code
    await AmbassadorClient.updateMany(
      { ambassadorCode: oldCode.toUpperCase() },
      { ambassadorCode: newCode.toUpperCase() }
    );

    let smsResult = null;
    if (resendSms && ambassador.phone?.trim() && smsService.isConfigured() && !ambassador.smsOptOut) {
      const signature = process.env.SMS_SIGNATURE || process.env.STORE_NAME || 'Ange Arras';
      const message = `Bonjour ${ambassador.firstName} ! Voici un nouveau code Parrainage : code ${newCode}. 3 pains pour vous, 1 pain pour le filleul à chaque carte créée. ${signature}`;
      const res = await smsService.sendSms(message, [ambassador.phone.trim()]);
      smsResult = res.success ? 'envoyé' : 'échec';
    }

    const updated = await Ambassador.findById(id);
    res.json({
      success: true,
      data: {
        ambassador: updated,
        newCode,
        smsResult
      }
    });
  } catch (error) {
    console.error('Erreur regenerateAmbassadorCode:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

// Renvoyer SMS avec nouveau code (sans régénérer le code)
const resendSmsAmbassador = async (req, res) => {
  try {
    const { id } = req.params;

    if (!smsService.isConfigured()) {
      return res.status(503).json({
        success: false,
        error: 'Service SMS non configuré.'
      });
    }

    const ambassador = await Ambassador.findById(id);
    if (!ambassador) {
      return res.status(404).json({ success: false, error: 'Ambassadeur introuvable' });
    }
    if (!ambassador.phone?.trim()) {
      return res.status(400).json({ success: false, error: 'Aucun numéro de téléphone' });
    }
    if (ambassador.smsOptOut) {
      return res.status(400).json({ success: false, error: 'Cet ambassadeur a répondu STOP, envoi impossible' });
    }

    const signature = process.env.SMS_SIGNATURE || process.env.STORE_NAME || 'Ange Arras';
    const message = `Bonjour ${ambassador.firstName} ! Voici un nouveau code Parrainage : code ${ambassador.code}. 3 pains pour vous, 1 pain pour le filleul à chaque carte créée. ${signature}`;
    const smsRes = await smsService.sendSms(message, [ambassador.phone.trim()]);

    if (!smsRes.success) {
      return res.status(500).json({ success: false, error: smsRes.error || 'Erreur envoi SMS' });
    }

    res.json({
      success: true,
      data: { message: 'SMS envoyé' }
    });
  } catch (error) {
    console.error('Erreur resendSmsAmbassador:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

// Régénérer un coupon (admin uniquement)
const regenerateCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    const client = await AmbassadorClient.findById(id).populate('ambassadorId');
    if (!client) {
      return res.status(404).json({ success: false, error: 'Client introuvable' });
    }
    const ambassador = client.ambassadorId;
    const validityDays = (ambassador && ambassador.couponValidityDays) || 30;
    const couponExpiresAt = new Date();
    couponExpiresAt.setDate(couponExpiresAt.getDate() + validityDays);
    const updated = await AmbassadorClient.findByIdAndUpdate(
      id,
      {
        couponExpiresAt,
        couponRegeneratedCount: (client.couponRegeneratedCount || 0) + 1
      },
      { new: true }
    ).populate('ambassadorId', 'firstName lastName code phone email couponValidityDays');
    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Erreur regenerateCoupon:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

// Synchroniser la blacklist OVH (numéros ayant répondu STOP) avec les ambassadeurs
const syncSmsBlacklist = async (req, res) => {
  try {
    if (!smsService.isConfigured()) {
      return res.status(503).json({
        success: false,
        error: 'Service SMS non configuré.'
      });
    }

    const blacklistedPhones = await smsService.getBlacklist();
    if (!blacklistedPhones || blacklistedPhones.length === 0) {
      return res.json({
        success: true,
        data: { updated: 0, message: 'Aucun numéro en blacklist OVH (ou API non disponible)' }
      });
    }

    const blacklistSet = new Set(
      blacklistedPhones
        .map(p => (typeof p === 'object' && p?.number ? p.number : p))
        .map(p => smsService.normalizePhone(String(p)))
        .filter(Boolean)
    );

    const ambassadors = await Ambassador.find({ phone: { $exists: true, $ne: '' } });
    let updated = 0;
    for (const a of ambassadors) {
      const norm = smsService.normalizePhone(a.phone);
      if (norm && blacklistSet.has(norm)) {
        await Ambassador.findByIdAndUpdate(a._id, { smsOptOut: true });
        updated++;
      }
    }

    res.json({
      success: true,
      data: {
        blacklistCount: blacklistedPhones.length,
        updated
      }
    });
  } catch (error) {
    console.error('Erreur syncSmsBlacklist:', error);
    res.status(500).json({ success: false, error: error.message || 'Erreur serveur' });
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
  getSmsTemplate,
  saveSmsTemplate,
  previewSmsToAmbassadors,
  sendSmsToAmbassadors,
  regenerateAmbassadorCode,
  resendSmsAmbassador,
  syncSmsBlacklist,
  validateVendeuse,
  getPublicAmbassadorCodes,
  getPublicAmbassadorsList,
  getPublicClients,
  getPublicClientsByAmbassador,
  createPublicClient,
  updatePublicClientGift,
  regenerateCoupon
};
