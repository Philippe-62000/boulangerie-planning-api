const express = require('express');
const multer = require('multer');
const router = express.Router();
const dailySalesController = require('../controllers/dailySalesController');

const pdfUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) => {
    const name = (file.originalname || '').toLowerCase();
    if (file.mimetype === 'application/pdf' || name.endsWith('.pdf') || !name.includes('.')) {
      return cb(null, true);
    }
    cb(new Error('Fichier PDF planning attendu'));
  }
});

// Route publique pour la saisie quotidienne (page autonome)
router.post('/submit', dailySalesController.submitDailySales);

// Routes pour les stats hebdomadaires (nécessitent une authentification)
router.get('/weekly', dailySalesController.getWeeklyStats);
router.get('/monthly', dailySalesController.getMonthlyAggregatedByEmployee);
router.get('/objectives', dailySalesController.getWeeklyObjectives);
router.post('/objectives', dailySalesController.setWeeklyObjectives);
router.post('/import-planning', pdfUpload.single('pdf'), dailySalesController.importPlanningPdf);
router.get('/planning-status', dailySalesController.getPlanningUploadStatus);
router.get('/employee/:saleCode', dailySalesController.getEmployeeInfoForDailySales);

module.exports = router;




