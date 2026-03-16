const express = require('express');
const multer = require('multer');
const router = express.Router();
const responsableKmController = require('../controllers/responsableKmController');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

// Endpoint de diagnostic pour vérifier que les routes responsable-km sont chargées
router.get('/health', (req, res) => {
  res.json({ ok: true, module: 'responsable-km', timestamp: new Date().toISOString() });
});

router.get('/trip-types', responsableKmController.getTripTypes);
router.get('/expense', responsableKmController.getExpense);
router.post('/expense', responsableKmController.saveExpense);
router.get('/peage-params', responsableKmController.getPeageParams);
router.post('/peage-params', responsableKmController.savePeageParams);
router.post('/import-pdf', upload.single('file'), responsableKmController.importPdf);
router.post('/confirm-import-pdf', upload.single('file'), responsableKmController.confirmImportPdf);
router.get('/toll-pdf/:site/:month/:year', responsableKmController.downloadTollPdf);
router.get('/taux-km', responsableKmController.getTauxKm);
router.post('/taux-km', responsableKmController.saveTauxKm);
router.patch('/trip-types/:tripTypeId', responsableKmController.updateTripType);
router.delete('/trip-types/:tripTypeId', responsableKmController.deleteTripType);
router.get('/divers-presets', responsableKmController.getDiversPresets);
router.post('/divers-presets', responsableKmController.saveDiversPreset);
router.post('/log-displacement', responsableKmController.logDisplacement);
router.get('/pending-displacements', responsableKmController.getPendingDisplacements);
router.post('/integrate-displacements', responsableKmController.integrateDisplacements);

module.exports = router;
