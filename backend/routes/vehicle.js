const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const router = express.Router();
const vehicleController = require('../controllers/vehicleController');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'uploads/temp/';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, unique + path.extname(file.originalname));
  }
});

const uploadPhoto = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ok = /\.(jpe?g|png|gif|webp|heic)$/i.test(file.originalname);
    if (ok) cb(null, true);
    else cb(new Error('Photo uniquement (jpg, png, gif, webp)'));
  }
});

router.get('/drivers', vehicleController.listDrivers);
router.get('/config', vehicleController.getConfig);
router.put('/config', vehicleController.putConfig);
router.get('/trips', vehicleController.listTrips);
router.get('/stats', vehicleController.getStats);
router.post('/trips', vehicleController.startTrip);
router.put('/trips/:id/return', vehicleController.completeReturn);
router.put('/trips/:id', vehicleController.updateTripAdmin);
router.post('/trips/:id/photo-retour', uploadPhoto.single('file'), vehicleController.uploadPhotoRetour);
router.get('/trips/:id/photo-retour/download', vehicleController.downloadPhotoRetour);

module.exports = router;
