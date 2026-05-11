const express = require('express');
const multer = require('multer');
const { authenticateEmployee } = require('../middleware/auth');
const positiveController = require('../controllers/positiveController');

const router = express.Router();

// Upload en mémoire — pas de stockage disque/NAS (choix produit MVP)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 12 * 1024 * 1024, // 12 Mo / photo
    files: 10
  },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype || !file.mimetype.startsWith('image/')) {
      return cb(new Error(`Type de fichier non supporté : ${file.mimetype}`));
    }
    cb(null, true);
  }
});

router.post('/scan', authenticateEmployee, upload.array('photos', 10), positiveController.scan);

router.get('/catalog', authenticateEmployee, positiveController.getCatalog);
router.put('/catalog', authenticateEmployee, positiveController.updateCatalog);

router.get('/scans', authenticateEmployee, positiveController.listScans);
router.get('/scans/:id', authenticateEmployee, positiveController.getScan);
router.delete('/scans/:id', authenticateEmployee, positiveController.deleteScan);

module.exports = router;
