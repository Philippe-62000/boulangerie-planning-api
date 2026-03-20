const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authenticateManager } = require('../middleware/auth');
const chorusController = require('../controllers/chorusController');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'uploads/temp/';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ok = /\.(pdf|jpg|jpeg|png|doc|docx)$/i.test(file.originalname);
    if (ok) cb(null, true);
    else cb(new Error('Type de fichier non autorisé (PDF, images, Word)'));
  }
});

router.use(authenticateManager);

router.get('/clients', chorusController.listClients);
router.post('/clients', chorusController.createClient);
router.put('/clients/:id', chorusController.updateClient);
router.delete('/clients/:id', chorusController.deleteClient);

router.get('/commandes', chorusController.listCommandes);
router.post('/commandes', chorusController.createCommande);
router.put('/commandes/:id', chorusController.updateCommande);
router.delete('/commandes/:id', chorusController.deleteCommande);

router.post('/commandes/:id/bon-de-commande', upload.single('file'), chorusController.uploadBonDeCommande);
router.get('/commandes/:id/bon-de-commande/download', chorusController.downloadBonDeCommande);

module.exports = router;
