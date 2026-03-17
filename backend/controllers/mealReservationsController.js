const ClientPro = require('../models/ClientPro');
const Produit = require('../models/Produit');
const Formule = require('../models/Formule');
const MealReservation = require('../models/MealReservation');
const ProductType = require('../models/ProductType');
const Parameter = require('../models/Parameters');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const emailService = require('../services/emailService');

const getSite = (req) => (req.query.site || req.body.site || 'longuenesse').toLowerCase();
const siteMap = { lon: 'longuenesse', plan: 'arras' };
const normalizeSite = (s) => siteMap[s] || (s === 'arras' ? 'arras' : 'longuenesse');

// --- Auth client pro ---
const clientProLogin = async (req, res) => {
  try {
    const { login, password } = req.body;
    const site = normalizeSite(getSite(req));
    if (!login || !password) {
      return res.status(400).json({ success: false, error: 'Login et mot de passe requis' });
    }
    const client = await ClientPro.findOne({ login: login.toLowerCase().trim(), site, actif: true }).select('+password');
    if (!client) {
      return res.status(401).json({ success: false, error: 'Identifiants incorrects' });
    }
    const valid = await bcrypt.compare(password, client.password);
    if (!valid) {
      return res.status(401).json({ success: false, error: 'Identifiants incorrects' });
    }
    const token = jwt.sign(
      { clientProId: client._id, login: client.login, role: 'client_pro', site: client.site },
      process.env.JWT_SECRET || 'votre-cle-secrete-ici',
      { expiresIn: '7d' }
    );
    res.json({
      success: true,
      token,
      client: {
        id: client._id,
        nom: client.nom,
        contact: client.contact,
        login: client.login
      }
    });
  } catch (err) {
    console.error('❌ clientProLogin:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// --- Clients pro (admin) ---
const getClientsPro = async (req, res) => {
  try {
    const site = normalizeSite(getSite(req));
    const clients = await ClientPro.find({ site }).sort({ nom: 1 });
    res.json({ success: true, data: clients });
  } catch (err) {
    console.error('❌ getClientsPro:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

const createClientPro = async (req, res) => {
  try {
    const site = normalizeSite(getSite(req));
    const { nom, adresse, contact, telephones, login, password } = req.body;
    if (!nom || !contact || !login || !password) {
      return res.status(400).json({ success: false, error: 'Nom, contact, login et mot de passe requis' });
    }
    const existing = await ClientPro.findOne({ login: login.toLowerCase().trim(), site });
    if (existing) {
      return res.status(400).json({ success: false, error: 'Ce login existe déjà pour ce site' });
    }
    const client = await ClientPro.create({
      nom, adresse: adresse || '', contact,
      telephones: Array.isArray(telephones) ? telephones : [],
      login: login.toLowerCase().trim(),
      password,
      site
    });
    res.json({ success: true, data: client });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ success: false, error: 'Ce login existe déjà' });
    }
    console.error('❌ createClientPro:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

const updateClientPro = async (req, res) => {
  try {
    const { id } = req.params;
    const { nom, adresse, contact, telephones, login, password, actif } = req.body;
    const client = await ClientPro.findById(id);
    if (!client) return res.status(404).json({ success: false, error: 'Client non trouvé' });
    if (nom !== undefined) client.nom = nom;
    if (adresse !== undefined) client.adresse = adresse;
    if (contact !== undefined) client.contact = contact;
    if (telephones !== undefined) client.telephones = telephones;
    if (login !== undefined) client.login = login.toLowerCase().trim();
    if (actif !== undefined) client.actif = actif;
    if (password && password.trim()) {
      client.password = password;
    }
    await client.save();
    res.json({ success: true, data: client });
  } catch (err) {
    console.error('❌ updateClientPro:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

const deleteClientPro = async (req, res) => {
  try {
    const { id } = req.params;
    await ClientPro.findByIdAndDelete(id);
    res.json({ success: true });
  } catch (err) {
    console.error('❌ deleteClientPro:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// --- Produits (admin) ---
const getProduits = async (req, res) => {
  try {
    const site = normalizeSite(getSite(req));
    const forBot = req.query.forBot === 'true';
    let q = { site };
    if (forBot) {
      q.enRupture = false;
      q.visible = true;
    }
    const produits = await Produit.find(q).sort({ ordre: 1, nom: 1 });
    res.json({ success: true, data: produits });
  } catch (err) {
    console.error('❌ getProduits:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

const createProduit = async (req, res) => {
  try {
    const site = normalizeSite(getSite(req));
    const { nom, type, enRupture, visible, dateDebut, dateFin, ordre } = req.body;
    if (!nom || !type) {
      return res.status(400).json({ success: false, error: 'Nom et type requis' });
    }
    const produit = await Produit.create({
      nom, type,
      enRupture: enRupture ?? false,
      visible: visible ?? true,
      dateDebut: dateDebut || null,
      dateFin: dateFin || null,
      ordre: ordre ?? 0,
      site
    });
    res.json({ success: true, data: produit });
  } catch (err) {
    console.error('❌ createProduit:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

const updateProduit = async (req, res) => {
  try {
    const { id } = req.params;
    const { nom, type, enRupture, visible, dateDebut, dateFin, ordre } = req.body;
    const produit = await Produit.findByIdAndUpdate(
      id,
      { $set: { nom, type, enRupture, visible, dateDebut, dateFin, ordre } },
      { new: true, runValidators: true }
    );
    if (!produit) return res.status(404).json({ success: false, error: 'Produit non trouvé' });
    res.json({ success: true, data: produit });
  } catch (err) {
    console.error('❌ updateProduit:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

const deleteProduit = async (req, res) => {
  try {
    const { id } = req.params;
    await Produit.findByIdAndDelete(id);
    res.json({ success: true });
  } catch (err) {
    console.error('❌ deleteProduit:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// --- Types de produits (admin) ---
const getProductTypes = async (req, res) => {
  try {
    const site = normalizeSite(getSite(req));
    let types = await ProductType.find({ site }).sort({ ordre: 1, nom: 1 });
    if (types.length === 0) {
      const defaults = [
        { nom: 'Entrée', value: 'entree', ordre: 1 },
        { nom: 'Plat', value: 'plat', ordre: 2 },
        { nom: 'Dessert', value: 'dessert', ordre: 3 },
        { nom: 'Goûter', value: 'gouter', ordre: 4 },
        { nom: 'Boisson', value: 'boisson', ordre: 5 },
        { nom: 'Fromage', value: 'fromage', ordre: 6 },
        { nom: 'Autre', value: 'autre', ordre: 7 }
      ];
      types = await ProductType.insertMany(defaults.map(t => ({ ...t, site })));
    }
    res.json({ success: true, data: types });
  } catch (err) {
    console.error('❌ getProductTypes:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

const createProductType = async (req, res) => {
  try {
    const site = normalizeSite(getSite(req));
    const { nom, ordre } = req.body;
    if (!nom || !nom.trim()) {
      return res.status(400).json({ success: false, error: 'Nom requis' });
    }
    const value = (nom.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')).replace(/\s+/g, '_').slice(0, 30);
    const type = await ProductType.create({
      nom: nom.trim(),
      value: value || 'autre',
      ordre: ordre ?? 0,
      site
    });
    res.json({ success: true, data: type });
  } catch (err) {
    console.error('❌ createProductType:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

const updateProductType = async (req, res) => {
  try {
    const { id } = req.params;
    const { nom, ordre } = req.body;
    const update = {};
    if (nom !== undefined) {
      update.nom = nom.trim();
      update.value = (nom.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')).replace(/\s+/g, '_').slice(0, 30) || 'autre';
    }
    if (ordre !== undefined) update.ordre = ordre;
    const type = await ProductType.findByIdAndUpdate(id, { $set: update }, { new: true });
    if (!type) return res.status(404).json({ success: false, error: 'Type non trouvé' });
    res.json({ success: true, data: type });
  } catch (err) {
    console.error('❌ updateProductType:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

const deleteProductType = async (req, res) => {
  try {
    const { id } = req.params;
    await ProductType.findByIdAndDelete(id);
    res.json({ success: true });
  } catch (err) {
    console.error('❌ deleteProductType:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// --- Formules (admin) ---
const getFormules = async (req, res) => {
  try {
    const site = normalizeSite(getSite(req));
    const forBot = req.query.forBot === 'true';
    let q = { site };
    if (forBot) q.actif = true;
    const formules = await Formule.find(q).populate('produitsInclus').sort({ ordre: 1, nom: 1 });
    res.json({ success: true, data: formules });
  } catch (err) {
    console.error('❌ getFormules:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

const createFormule = async (req, res) => {
  try {
    const site = normalizeSite(getSite(req));
    const { nom, description, prix, options, produitsInclus, actif, ordre } = req.body;
    if (!nom || prix === undefined) {
      return res.status(400).json({ success: false, error: 'Nom et prix requis' });
    }
    const formule = await Formule.create({
      nom, description: description || '', prix,
      options: options || [],
      produitsInclus: produitsInclus || [],
      actif: actif ?? true,
      ordre: ordre ?? 0,
      site
    });
    const populated = await Formule.findById(formule._id).populate('produitsInclus');
    res.json({ success: true, data: populated });
  } catch (err) {
    console.error('❌ createFormule:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

const updateFormule = async (req, res) => {
  try {
    const { id } = req.params;
    const { nom, description, prix, options, produitsInclus, actif, ordre } = req.body;
    const update = {};
    if (nom !== undefined) update.nom = nom;
    if (description !== undefined) update.description = description;
    if (prix !== undefined) update.prix = prix;
    if (options !== undefined) update.options = options;
    if (produitsInclus !== undefined) update.produitsInclus = produitsInclus;
    if (actif !== undefined) update.actif = actif;
    if (ordre !== undefined) update.ordre = ordre;
    const formule = await Formule.findByIdAndUpdate(id, { $set: update }, { new: true }).populate('produitsInclus');
    if (!formule) return res.status(404).json({ success: false, error: 'Formule non trouvée' });
    res.json({ success: true, data: formule });
  } catch (err) {
    console.error('❌ updateFormule:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

const deleteFormule = async (req, res) => {
  try {
    const { id } = req.params;
    await Formule.findByIdAndDelete(id);
    res.json({ success: true });
  } catch (err) {
    console.error('❌ deleteFormule:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// --- Réservations ---
const getReservations = async (req, res) => {
  try {
    const site = normalizeSite(getSite(req));
    const { date, clientProId, statut } = req.query;
    let q = { site };
    if (date) q.date = { $gte: new Date(date + 'T00:00:00'), $lt: new Date(new Date(date).getTime() + 86400000) };
    if (clientProId) q.clientProId = clientProId;
    if (statut) q.statut = statut;
    const reservations = await MealReservation.find(q)
      .populate('clientProId')
      .populate('formuleId')
      .populate('produitsAjoutes')
      .populate('produitsRetires')
      .sort({ date: 1, createdAt: -1 });
    res.json({ success: true, data: reservations });
  } catch (err) {
    console.error('❌ getReservations:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

const createReservation = async (req, res) => {
  try {
    const site = normalizeSite(getSite(req));
    const { date, formuleId, optionsChoisies, produitsAjoutes, produitsRetires, quantite, forfaitInstallation, remarques } = req.body;
    let clientProId = req.body.clientProId;
    if (!clientProId && req.clientProId) clientProId = req.clientProId;
    if (!clientProId || !date || !formuleId || !quantite) {
      return res.status(400).json({ success: false, error: 'Client, date, formule et quantité requis' });
    }
    const reservation = await MealReservation.create({
      clientProId,
      date: new Date(date),
      formuleId,
      optionsChoisies: optionsChoisies || {},
      produitsAjoutes: produitsAjoutes || [],
      produitsRetires: produitsRetires || [],
      quantite: parseInt(quantite, 10) || 1,
      remarques: remarques || '',
      site
    });
    const populated = await MealReservation.findById(reservation._id)
      .populate('clientProId')
      .populate('formuleId')
      .populate('produitsAjoutes')
      .populate('produitsRetires');
    await sendReservationEmails(populated);
    res.json({ success: true, data: populated });
  } catch (err) {
    console.error('❌ createReservation:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

const updateReservation = async (req, res) => {
  try {
    const { id } = req.params;
    const { statut } = req.body;
    const reservation = await MealReservation.findByIdAndUpdate(
      id,
      { $set: { statut } },
      { new: true }
    )
      .populate('clientProId')
      .populate('formuleId')
      .populate('produitsAjoutes')
      .populate('produitsRetires');
    if (!reservation) return res.status(404).json({ success: false, error: 'Réservation non trouvée' });
    res.json({ success: true, data: reservation });
  } catch (err) {
    console.error('❌ updateReservation:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

async function sendReservationEmails(reservation) {
  try {
    const client = reservation.clientProId;
    const formule = reservation.formuleId;
    const dateStr = new Date(reservation.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    const prixFormule = (formule?.prix || 0) * reservation.quantite;
    const prixForfait = reservation.forfaitInstallation?.prix || 0;
    const total = prixFormule + prixForfait;
    const recap = [
      `Date : ${dateStr}`,
      `Formule : ${formule?.nom || '-'} (${formule?.prix || 0}€ x ${reservation.quantite} = ${prixFormule.toFixed(2)}€)`,
      reservation.forfaitInstallation ? `Forfait installation : ${reservation.forfaitInstallation.nbTables} table(s) (${prixForfait}€)` : null,
      `Total : ${total.toFixed(2)}€`,
      `Options : ${JSON.stringify(reservation.optionsChoisies || {})}`,
      reservation.remarques ? `Remarques : ${reservation.remarques}` : ''
    ].filter(Boolean).join('\n');
    const html = `
      <h2>Réservation plateaux repas confirmée</h2>
      <p>Bonjour ${client?.nom || 'Client'},</p>
      <p>Votre réservation a bien été enregistrée.</p>
      <pre>${recap}</pre>
      <p>— Boulangerie Ange</p>
    `;
    if (client?.contact) {
      await emailService.sendEmail(client.contact, 'Réservation plateaux repas confirmée', html, recap);
    }
    const adminEmail = await Parameter.findOne({ name: 'emailNotificationsPlateaux' }).then(p => p?.stringValue);
    if (!adminEmail) {
      const fallback = await Parameter.findOne({ name: 'adminEmail' }).then(p => p?.stringValue);
      if (fallback) {
        await emailService.sendEmail(
          fallback,
          `Nouvelle réservation - ${client?.nom || 'Client'} - ${dateStr}`,
          `<h2>Nouvelle réservation plateaux repas</h2><p>Client : ${client?.nom}</p><pre>${recap}</pre>`,
          recap
        );
      }
    } else {
      await emailService.sendEmail(
        adminEmail,
        `Nouvelle réservation - ${client?.nom || 'Client'} - ${dateStr}`,
        `<h2>Nouvelle réservation plateaux repas</h2><p>Client : ${client?.nom}</p><pre>${recap}</pre>`,
        recap
      );
    }
  } catch (e) {
    console.error('❌ sendReservationEmails:', e);
  }
}

// --- Données pour le bot (publiques ou avec token client) ---
const getBotData = async (req, res) => {
  try {
    const site = normalizeSite(getSite(req));
    const [produits, formules] = await Promise.all([
      Produit.find({ site, enRupture: false, visible: true }).sort({ ordre: 1, nom: 1 }),
      Formule.find({ site, actif: true }).populate('produitsInclus').sort({ ordre: 1, nom: 1 })
    ]);
    res.json({ success: true, data: { produits, formules } });
  } catch (err) {
    console.error('❌ getBotData:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// Réservations du client connecté
const getMyReservations = async (req, res) => {
  try {
    const clientProId = req.clientProId;
    if (!clientProId) return res.status(401).json({ success: false, error: 'Non authentifié' });
    const site = normalizeSite(getSite(req));
    const reservations = await MealReservation.find({ clientProId, site })
      .populate('formuleId')
      .sort({ date: -1 });
    res.json({ success: true, data: reservations });
  } catch (err) {
    console.error('❌ getMyReservations:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

module.exports = {
  clientProLogin,
  getClientsPro,
  createClientPro,
  updateClientPro,
  deleteClientPro,
  getProduits,
  createProduit,
  updateProduit,
  deleteProduit,
  getProductTypes,
  createProductType,
  updateProductType,
  deleteProductType,
  getFormules,
  createFormule,
  updateFormule,
  deleteFormule,
  getReservations,
  createReservation,
  updateReservation,
  getBotData,
  getMyReservations
};
