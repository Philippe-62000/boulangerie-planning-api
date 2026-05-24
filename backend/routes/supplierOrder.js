const express = require('express');
const multer = require('multer');
const router = express.Router();
const { authenticateEmployee } = require('../middleware/auth');
const ctrl = require('../controllers/supplierOrderController');

const pdfUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf' || file.originalname?.toLowerCase().endsWith('.pdf')) {
      return cb(null, true);
    }
    cb(new Error('Fichier PDF attendu'));
  }
});

router.get('/locations', authenticateEmployee, ctrl.getLocations);
router.put('/locations', authenticateEmployee, ctrl.putLocations);

router.get('/products', authenticateEmployee, ctrl.getProducts);
router.put('/products', authenticateEmployee, ctrl.putProducts);
router.post('/products/import', authenticateEmployee, ctrl.importProducts);

router.get('/current', authenticateEmployee, ctrl.getCurrentOrder);
router.put('/current', authenticateEmployee, ctrl.saveCurrentOrder);
router.post('/current/submit', authenticateEmployee, ctrl.submitCurrentOrder);
router.post('/current/refresh-last', authenticateEmployee, ctrl.refreshLastOrderQty);
router.post('/current/apply-positive', authenticateEmployee, ctrl.applyPositiveStock);
router.post('/current/apply-employee-stocks', authenticateEmployee, ctrl.applyEmployeeStocks);

router.get('/recap', authenticateEmployee, ctrl.getRecap);

router.post('/seed-arras-catalog', authenticateEmployee, ctrl.seedArrasCatalog);
router.post('/import-delivery-pdf', authenticateEmployee, pdfUpload.single('pdf'), ctrl.importDeliveryPdf);
router.post('/current/apply-received', authenticateEmployee, ctrl.applyReceivedFromLast);
router.post('/current/compute-forecast', authenticateEmployee, ctrl.computeForecast);

module.exports = router;
