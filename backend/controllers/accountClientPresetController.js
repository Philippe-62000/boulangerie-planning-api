const mongoose = require('mongoose');
const AccountClientPreset = require('../models/AccountClientPreset');

const siteVal = (s) => (s === 'arras' ? 'arras' : 'longuenesse');

exports.list = async (req, res) => {
  try {
    const site = siteVal(req.query.site);
    const items = await AccountClientPreset.find({ site })
      .sort({ lastName: 1, firstName: 1 })
      .limit(200)
      .lean();
    return res.json({ success: true, data: items });
  } catch (e) {
    console.error('accountClientPreset list:', e);
    return res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

exports.create = async (req, res) => {
  try {
    const site = siteVal(req.body.site);
    const firstName = typeof req.body.firstName === 'string' ? req.body.firstName.trim() : '';
    const lastName = typeof req.body.lastName === 'string' ? req.body.lastName.trim() : '';
    if (!firstName || !lastName) {
      return res.status(400).json({ success: false, error: 'Prénom et nom requis' });
    }
    const doc = await AccountClientPreset.create({ site, firstName, lastName });
    return res.status(201).json({ success: true, data: doc });
  } catch (e) {
    console.error('accountClientPreset create:', e);
    return res.status(500).json({ success: false, error: 'Erreur lors de la création' });
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: 'Identifiant invalide' });
    }
    const firstName = typeof req.body.firstName === 'string' ? req.body.firstName.trim() : '';
    const lastName = typeof req.body.lastName === 'string' ? req.body.lastName.trim() : '';
    if (!firstName || !lastName) {
      return res.status(400).json({ success: false, error: 'Prénom et nom requis' });
    }
    const doc = await AccountClientPreset.findByIdAndUpdate(
      id,
      { $set: { firstName, lastName } },
      { new: true }
    );
    if (!doc) {
      return res.status(404).json({ success: false, error: 'Client introuvable' });
    }
    return res.json({ success: true, data: doc });
  } catch (e) {
    console.error('accountClientPreset update:', e);
    return res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

exports.remove = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: 'Identifiant invalide' });
    }
    const doc = await AccountClientPreset.findByIdAndDelete(id);
    if (!doc) {
      return res.status(404).json({ success: false, error: 'Client introuvable' });
    }
    return res.json({ success: true, data: { id } });
  } catch (e) {
    console.error('accountClientPreset remove:', e);
    return res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};
