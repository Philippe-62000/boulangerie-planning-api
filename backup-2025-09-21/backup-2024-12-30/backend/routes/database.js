const express = require('express');
const multer = require('multer');
const { exportDatabase, importDatabase, getDatabaseStats } = require('../controllers/databaseController');

const router = express.Router();

// Configuration de multer pour l'upload de fichiers
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB max
  },
  fileFilter: (req, file, cb) => {
    // Accepter seulement les fichiers JSON
    if (file.mimetype === 'application/json' || file.originalname.endsWith('.json')) {
      cb(null, true);
    } else {
      cb(new Error('Seuls les fichiers JSON sont acceptés'), false);
    }
  }
});

// Route pour exporter la base de données
router.get('/export', exportDatabase);

// Route pour importer la base de données
router.post('/import', upload.single('backupFile'), importDatabase);

// Route pour obtenir les statistiques de la base de données
router.get('/stats', getDatabaseStats);

module.exports = router;


