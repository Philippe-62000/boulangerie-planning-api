const express = require('express');
const router = express.Router();
const passwordController = require('../controllers/passwordController');

// Route pour mettre à jour un mot de passe
router.put('/update', passwordController.updatePassword);

// Route pour récupérer la liste des utilisateurs (sans mots de passe)
router.get('/users', passwordController.getUsers);

// Route pour récupérer les mots de passe des fiches de paie
router.get('/payslip-passwords', passwordController.getPayslipPasswords);

// Route pour télécharger le fichier mots_de_passe.bat
router.get('/download-payslip-passwords-bat', passwordController.downloadPayslipPasswordsBat);

// Route pour importer les mots de passe depuis le fichier mots_de_passe.bat
router.post('/import-payslip-passwords-from-bat', passwordController.importPayslipPasswordsFromBat);

module.exports = router;
