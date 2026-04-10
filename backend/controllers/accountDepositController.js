const mongoose = require('mongoose');
const AccountDeposit = require('../models/AccountDeposit');

const MAX_SIGNATURE_LEN = 2 * 1024 * 1024; // ~2 Mo data URL

exports.create = async (req, res) => {
  try {
    const { firstName, lastName, amount, tpeAuthNumber, signatureImage, site } = req.body;

    const fn = typeof firstName === 'string' ? firstName.trim() : '';
    const ln = typeof lastName === 'string' ? lastName.trim() : '';
    if (!fn || !ln) {
      return res.status(400).json({ success: false, error: 'Prénom et nom sont requis' });
    }

    const num = Number(amount);
    if (!Number.isFinite(num) || num <= 0) {
      return res.status(400).json({ success: false, error: 'Montant invalide' });
    }

    const sig = typeof signatureImage === 'string' ? signatureImage.trim() : '';
    if (!sig || !sig.startsWith('data:image/')) {
      return res.status(400).json({ success: false, error: 'Signature du client requise' });
    }
    if (sig.length > MAX_SIGNATURE_LEN) {
      return res.status(400).json({ success: false, error: 'Signature trop volumineuse' });
    }

    const siteVal = site === 'arras' ? 'arras' : 'longuenesse';
    const auth = typeof tpeAuthNumber === 'string' ? tpeAuthNumber.trim().slice(0, 32) : '';

    const user = req.user || {};
    const isEmployee = user.role === 'employee';
    const saleCodeFromJwt = typeof req.saleCode === 'string' ? req.saleCode.trim().slice(0, 3) : '';
    const doc = await AccountDeposit.create({
      site: siteVal,
      firstName: fn,
      lastName: ln,
      amount: Math.round(num * 100) / 100,
      tpeAuthNumber: auth,
      signatureImage: sig,
      createdByEmployeeId: isEmployee && user.id ? user.id : null,
      createdByName: user.name || '',
      createdByEmail: user.email || '',
      registeredSaleCode: saleCodeFromJwt
    });

    return res.status(201).json({ success: true, data: doc });
  } catch (e) {
    console.error('accountDeposit create:', e);
    return res.status(500).json({ success: false, error: 'Erreur lors de l\'enregistrement' });
  }
};

exports.list = async (req, res) => {
  try {
    const site = req.query.site;
    const filter = {};
    if (site === 'longuenesse' || site === 'arras') {
      filter.site = site;
    }

    const items = await AccountDeposit.find(filter)
      .sort({ createdAt: -1 })
      .limit(500)
      .lean();

    return res.json({ success: true, data: items });
  } catch (e) {
    console.error('accountDeposit list:', e);
    return res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: 'Identifiant invalide' });
    }
    const { accountCredited, putInRegister } = req.body;
    const user = req.user || {};

    const update = {};
    if (typeof accountCredited === 'boolean') {
      update.accountCredited = accountCredited;
      if (accountCredited) {
        update.accountCreditedAt = new Date();
        update.accountCreditedById = user.id || null;
        update.accountCreditedByName = user.name || user.email || '';
      } else {
        update.accountCreditedAt = null;
        update.accountCreditedById = null;
        update.accountCreditedByName = '';
      }
    }
    if (typeof putInRegister === 'boolean') {
      update.putInRegister = putInRegister;
      if (putInRegister) {
        update.putInRegisterAt = new Date();
        update.putInRegisterById = user.id || null;
        update.putInRegisterByName = user.name || user.email || '';
      } else {
        update.putInRegisterAt = null;
        update.putInRegisterById = null;
        update.putInRegisterByName = '';
      }
    }

    if (Object.keys(update).length === 0) {
      return res.status(400).json({ success: false, error: 'Aucune mise à jour demandée' });
    }

    const doc = await AccountDeposit.findByIdAndUpdate(id, { $set: update }, { new: true });
    if (!doc) {
      return res.status(404).json({ success: false, error: 'Dépôt introuvable' });
    }

    return res.json({ success: true, data: doc });
  } catch (e) {
    console.error('accountDeposit updateStatus:', e);
    return res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

exports.remove = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: 'Identifiant invalide' });
    }
    const doc = await AccountDeposit.findByIdAndDelete(id);
    if (!doc) {
      return res.status(404).json({ success: false, error: 'Dépôt introuvable' });
    }
    return res.json({ success: true, data: { id } });
  } catch (e) {
    console.error('accountDeposit remove:', e);
    return res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};
