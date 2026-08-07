const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const documentController = require('../controllers/documentController');
const { authenticateEmployee } = require('../middleware/auth');

// Configuration multer pour l'upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Dossier temporaire pour les uploads
    cb(null, 'uploads/temp/');
  },
  filename: function (req, file, cb) {
    // Nom unique pour éviter les conflits
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max
  },
  fileFilter: function (req, file, cb) {
    // Accepter surtout sur l'extension : le MIME varie selon le navigateur
    // (ex. application/octet-stream) et faisait échouer certains uploads.
    const allowedExt = new Set(['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.jpg', '.jpeg', '.png', '.txt']);
    const ext = path.extname(file.originalname || '').toLowerCase();
    if (allowedExt.has(ext)) {
      return cb(null, true);
    }
    cb(new Error(`Type de fichier non autorisé (${ext || 'inconnu'}). Autorisés: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG, TXT`));
  }
});

function handleMulterUploadError(err, req, res, next) {
  if (!err) return next();
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'Fichier trop volumineux (maximum 10 Mo)'
      });
    }
    return res.status(400).json({
      success: false,
      message: `Erreur upload: ${err.message}`
    });
  }
  return res.status(400).json({
    success: false,
    message: err.message || 'Erreur lors de l\'upload du fichier'
  });
}

// Middleware pour créer le dossier temp s'il n'existe pas
const ensureTempDir = (req, res, next) => {
  const fs = require('fs');
  const tempDir = 'uploads/temp/';
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  next();
};

// Routes pour les documents

// Route de test pour vérifier que les routes fonctionnent
router.get('/test', (req, res) => {
  res.json({ message: 'Route documents fonctionne', timestamp: new Date().toISOString() });
});

// Route de test pour le téléchargement
router.get('/test-download/:id', (req, res) => {
  res.json({ 
    message: 'Route téléchargement test fonctionne', 
    documentId: req.params.id,
    timestamp: new Date().toISOString() 
  });
});

// Route de test avec le même pattern que download
router.get('/:id/test', (req, res) => {
  res.json({ 
    message: 'Route pattern test fonctionne', 
    documentId: req.params.id,
    timestamp: new Date().toISOString() 
  });
});

// GET /api/documents/general - Récupérer les documents généraux
router.get('/general', documentController.getGeneralDocuments);

// GET /api/documents/stats - Statistiques des documents (admin seulement)
router.get('/stats', documentController.getDocumentStats);

// GET /api/documents/all-personal - Récupérer tous les documents personnels (admin)
router.get('/all-personal', documentController.getAllPersonalDocuments);

// GET /api/documents/employee-uploads - Fichiers envoyés par les salariés (admin)
router.get('/employee-uploads', documentController.getEmployeeUploads);

// POST /api/documents/employee-upload - Envoi par un salarié connecté
router.post('/employee-upload', ensureTempDir, authenticateEmployee, upload.single('file'), documentController.uploadEmployeeDocument);

// POST /api/documents/employee-upload/:documentId/confirm-receipt - Confirmer la lecture (admin) + e-mail au salarié
router.post('/employee-upload/:documentId/confirm-receipt', documentController.confirmEmployeeUploadReceipt);

// GET /api/documents/orphaned - Lister les fiches orphelines sur le NAS (admin seulement)
router.get('/orphaned', documentController.getOrphanedDocuments);

// POST /api/documents/reassociate - Réassocier un fichier orphelin à un employé (admin seulement)
router.post('/reassociate', documentController.reassociateOrphanedDocument);

// GET /api/documents/:id/download - Télécharger un document (AVANT personal pour éviter les conflits)
router.get('/:id/download', documentController.downloadDocument);

// GET /api/documents/personal/:employeeId - Récupérer les documents personnels d'un employé
router.get('/personal/:employeeId', documentController.getPersonalDocuments);

// POST /api/documents/upload - Upload un document (admin seulement)
router.post(
  '/upload',
  ensureTempDir,
  (req, res, next) => {
    upload.single('file')(req, res, (err) => handleMulterUploadError(err, req, res, next));
  },
  documentController.uploadDocument
);

// DELETE /api/documents/:documentId - Supprimer un document (admin seulement)
router.delete('/:documentId', documentController.deleteDocument);

// POST /api/documents/cleanup - Nettoyer les documents expirés (admin seulement)
router.post('/cleanup', documentController.cleanExpiredDocuments);

// POST /api/documents/cleanup-old - Nettoyer les anciens documents (admin seulement)
router.post('/cleanup-old', documentController.cleanupOldDocuments);

// POST /api/documents/delete-all - Supprimer TOUS les documents (admin seulement) - DANGEREUX
router.post('/delete-all', documentController.deleteAllDocuments);

module.exports = router;
