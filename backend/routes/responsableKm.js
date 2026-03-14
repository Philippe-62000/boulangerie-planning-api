const express = require('express');
const multer = require('multer');
const router = express.Router();
const responsableKmController = require('../controllers/responsableKmController');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

router.get('/trip-types', responsableKmController.getTripTypes);
router.get('/expense', responsableKmController.getExpense);
router.post('/expense', responsableKmController.saveExpense);
router.post('/import-pdf', upload.single('file'), responsableKmController.importPdf);
router.get('/taux-km', responsableKmController.getTauxKm);
router.post('/taux-km', responsableKmController.saveTauxKm);

module.exports = router;
