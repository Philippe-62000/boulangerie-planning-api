const path = require('path');
const fs = require('fs');
const ChorusClient = require('../models/ChorusClient');
const ChorusCommande = require('../models/ChorusCommande');
const sftpService = require('../services/sftpService');

const NAS_BASE = process.env.NAS_BASE_PATH || process.env.SFTP_BASE_PATH || '/n8n/uploads/documents';

const getSite = (req) => {
  const s = (req.query.site || req.body.site || 'longuenesse').toLowerCase();
  return s === 'arras' ? 'arras' : 'longuenesse';
};

const normalizePath = (...parts) => parts.filter(Boolean).join('/').replace(/\\/g, '/');

// --- Clients ---
exports.listClients = async (req, res) => {
  try {
    const site = getSite(req);
    const clients = await ChorusClient.find({ site }).sort({ nom: 1 });
    res.json({ success: true, data: clients });
  } catch (e) {
    console.error('chorus listClients', e);
    res.status(500).json({ success: false, error: e.message });
  }
};

exports.createClient = async (req, res) => {
  try {
    const site = getSite(req);
    const { nom, remarques } = req.body;
    if (!nom || !String(nom).trim()) {
      return res.status(400).json({ success: false, error: 'Le nom est requis' });
    }
    const client = await ChorusClient.create({
      nom: String(nom).trim(),
      remarques: remarques != null ? String(remarques) : '',
      site
    });
    res.json({ success: true, data: client });
  } catch (e) {
    console.error('chorus createClient', e);
    res.status(500).json({ success: false, error: e.message });
  }
};

exports.updateClient = async (req, res) => {
  try {
    const site = getSite(req);
    const { id } = req.params;
    const { nom, remarques } = req.body;
    const client = await ChorusClient.findOne({ _id: id, site });
    if (!client) return res.status(404).json({ success: false, error: 'Client introuvable' });
    if (nom !== undefined) client.nom = String(nom).trim();
    if (remarques !== undefined) client.remarques = String(remarques);
    await client.save();
    res.json({ success: true, data: client });
  } catch (e) {
    console.error('chorus updateClient', e);
    res.status(500).json({ success: false, error: e.message });
  }
};

exports.deleteClient = async (req, res) => {
  try {
    const site = getSite(req);
    const { id } = req.params;
    const count = await ChorusCommande.countDocuments({ clientId: id, site });
    if (count > 0) {
      return res.status(400).json({
        success: false,
        error: `Impossible de supprimer : ${count} commande(s) liée(s) à ce client`
      });
    }
    const r = await ChorusClient.deleteOne({ _id: id, site });
    if (r.deletedCount === 0) return res.status(404).json({ success: false, error: 'Client introuvable' });
    res.json({ success: true });
  } catch (e) {
    console.error('chorus deleteClient', e);
    res.status(500).json({ success: false, error: e.message });
  }
};

// --- Commandes ---
exports.listCommandes = async (req, res) => {
  try {
    const site = getSite(req);
    const commandes = await ChorusCommande.find({ site })
      .populate('clientId', 'nom remarques')
      .sort({ dateCommande: -1, createdAt: -1 });
    res.json({ success: true, data: commandes });
  } catch (e) {
    console.error('chorus listCommandes', e);
    res.status(500).json({ success: false, error: e.message });
  }
};

exports.createCommande = async (req, res) => {
  try {
    const site = getSite(req);
    const { dateCommande, clientId, statut } = req.body;
    if (!dateCommande || !clientId) {
      return res.status(400).json({ success: false, error: 'Date et client requis' });
    }
    const client = await ChorusClient.findOne({ _id: clientId, site });
    if (!client) return res.status(400).json({ success: false, error: 'Client invalide' });
    const allowed = ['en_cours', 'realisee', 'annulee'];
    const s = allowed.includes(statut) ? statut : 'en_cours';
    const cmd = await ChorusCommande.create({
      dateCommande: new Date(dateCommande),
      clientId,
      statut: s,
      site
    });
    const populated = await ChorusCommande.findById(cmd._id).populate('clientId', 'nom remarques');
    res.json({ success: true, data: populated });
  } catch (e) {
    console.error('chorus createCommande', e);
    res.status(500).json({ success: false, error: e.message });
  }
};

exports.updateCommande = async (req, res) => {
  try {
    const site = getSite(req);
    const { id } = req.params;
    const {
      dateCommande,
      clientId,
      statut,
      deposedChorus,
      misEnCaisse,
      paiementRecu
    } = req.body;

    const cmd = await ChorusCommande.findOne({ _id: id, site });
    if (!cmd) return res.status(404).json({ success: false, error: 'Commande introuvable' });

    if (dateCommande !== undefined) cmd.dateCommande = new Date(dateCommande);
    if (clientId !== undefined) {
      const c = await ChorusClient.findOne({ _id: clientId, site });
      if (!c) return res.status(400).json({ success: false, error: 'Client invalide' });
      cmd.clientId = clientId;
    }
    if (statut !== undefined) {
      if (!['en_cours', 'realisee', 'annulee'].includes(statut)) {
        return res.status(400).json({ success: false, error: 'Statut invalide' });
      }
      cmd.statut = statut;
    }
    if (deposedChorus !== undefined) cmd.deposedChorus = Boolean(deposedChorus);
    if (misEnCaisse !== undefined) cmd.misEnCaisse = Boolean(misEnCaisse);
    if (paiementRecu !== undefined) cmd.paiementRecu = Boolean(paiementRecu);

    await cmd.save();
    const populated = await ChorusCommande.findById(cmd._id).populate('clientId', 'nom remarques');
    res.json({ success: true, data: populated });
  } catch (e) {
    console.error('chorus updateCommande', e);
    res.status(500).json({ success: false, error: e.message });
  }
};

exports.deleteCommande = async (req, res) => {
  try {
    const site = getSite(req);
    const { id } = req.params;
    const cmd = await ChorusCommande.findOne({ _id: id, site });
    if (!cmd) return res.status(404).json({ success: false, error: 'Commande introuvable' });

    if (cmd.bonDeCommandeFilePath) {
      const fullPath = normalizePath(NAS_BASE, cmd.bonDeCommandeFilePath);
      try {
        await sftpService.connect();
        const exists = await sftpService.fileExists(fullPath);
        if (exists) await sftpService.deleteFile(fullPath);
      } catch (err) {
        console.warn('chorus deleteCommande fichier NAS:', err.message);
      } finally {
        try { await sftpService.disconnect(); } catch (_) {}
      }
    }

    await ChorusCommande.deleteOne({ _id: id, site });
    res.json({ success: true });
  } catch (e) {
    console.error('chorus deleteCommande', e);
    res.status(500).json({ success: false, error: e.message });
  }
};

exports.uploadBonDeCommande = async (req, res) => {
  try {
    const site = getSite(req);
    const { id } = req.params;
    if (!req.file) return res.status(400).json({ success: false, error: 'Fichier requis' });

    const cmd = await ChorusCommande.findOne({ _id: id, site });
    if (!cmd) {
      try { fs.unlinkSync(req.file.path); } catch (_) {}
      return res.status(404).json({ success: false, error: 'Commande introuvable' });
    }

    // Ancien fichier
    if (cmd.bonDeCommandeFilePath) {
      const oldFull = normalizePath(NAS_BASE, cmd.bonDeCommandeFilePath);
      try {
        await sftpService.connect();
        if (await sftpService.fileExists(oldFull)) await sftpService.deleteFile(oldFull);
      } catch (_) {}
      try { await sftpService.disconnect(); } catch (_) {}
    }

    const ext = path.extname(req.file.originalname) || '.pdf';
    const safeBase = path.basename(req.file.originalname, ext).replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 80);
    const fileName = `${cmd._id}_${Date.now()}_${safeBase}${ext}`;
    // Un seul dossier `chorus/` sous NAS_BASE : la racine est déjà spécifique au site (ex. documents-longuenesse)
    const relDir = 'chorus';
    const relPath = normalizePath(relDir, fileName);
    const fullDir = normalizePath(NAS_BASE, relDir);
    const fullPath = normalizePath(NAS_BASE, relPath);

    let sftpConnected = false;
    try {
      await sftpService.connect();
      sftpConnected = true;
      try {
        await sftpService.client.stat(fullDir);
      } catch {
        await sftpService.client.mkdir(fullDir, true);
      }
      await sftpService.put(req.file.path, fullPath);
    } finally {
      if (sftpConnected) {
        try { await sftpService.disconnect(); } catch (_) {}
      }
      try { if (req.file.path && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path); } catch (_) {}
    }

    cmd.bonDeCommandeFilePath = relPath;
    cmd.bonDeCommandeFileName = path.basename(req.file.originalname);
    cmd.bonDeCommandeMimeType = req.file.mimetype || 'application/octet-stream';
    await cmd.save();

    const populated = await ChorusCommande.findById(cmd._id).populate('clientId', 'nom remarques');
    res.json({ success: true, data: populated });
  } catch (e) {
    console.error('chorus uploadBonDeCommande', e);
    try { if (req.file?.path && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path); } catch (_) {}
    res.status(500).json({ success: false, error: e.message });
  }
};

exports.downloadBonDeCommande = async (req, res) => {
  let sftpConnected = false;
  try {
    const site = getSite(req);
    const { id } = req.params;
    const cmd = await ChorusCommande.findOne({ _id: id, site });
    if (!cmd || !cmd.bonDeCommandeFilePath) {
      return res.status(404).json({ success: false, error: 'Fichier introuvable' });
    }
    const fullPath = normalizePath(NAS_BASE, cmd.bonDeCommandeFilePath);
    await sftpService.connect();
    sftpConnected = true;
    if (!(await sftpService.fileExists(fullPath))) {
      return res.status(404).json({ success: false, error: 'Fichier absent du NAS' });
    }
    const buffer = await sftpService.downloadFile(fullPath);
    const downloadName = cmd.bonDeCommandeFileName || path.basename(cmd.bonDeCommandeFilePath);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(downloadName)}"`);
    res.setHeader('Content-Type', cmd.bonDeCommandeMimeType || 'application/octet-stream');
    res.send(buffer);
  } catch (e) {
    console.error('chorus downloadBonDeCommande', e);
    if (!res.headersSent) res.status(500).json({ success: false, error: e.message });
  } finally {
    if (sftpConnected) {
      try { await sftpService.disconnect(); } catch (_) {}
    }
  }
};
