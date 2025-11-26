const express = require('express');
const router = express.Router();
const advanceRequestController = require('../controllers/advanceRequestController');

// Middleware d'authentification pour les salariés
const authenticateEmployee = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Token d\'authentification requis'
      });
    }
    
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'votre-cle-secrete-ici');
    
    if (decoded.role !== 'employee') {
      return res.status(403).json({
        success: false,
        error: 'Accès non autorisé'
      });
    }
    
    // Ajouter les informations de l'employé à req.user pour compatibilité
    req.user = {
      id: decoded.employeeId,
      email: decoded.email,
      name: decoded.name,
      role: decoded.role
    };
    
    req.employeeId = decoded.employeeId;
    req.employeeEmail = decoded.email;
    req.employeeName = decoded.name;
    
    next();
  } catch (error) {
    console.error('❌ Erreur authentification:', error);
    res.status(401).json({
      success: false,
      error: 'Token invalide'
    });
  }
};

// Middleware d'authentification pour les managers
const authenticateManager = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Token d\'authentification requis'
      });
    }
    
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'votre-cle-secrete-ici');
    
    if (!['manager', 'admin'].includes(decoded.role)) {
      return res.status(403).json({
        success: false,
        error: 'Accès non autorisé - Manager requis'
      });
    }
    
    req.user = {
      id: decoded.employeeId || decoded.userId,
      email: decoded.email,
      name: decoded.name,
      role: decoded.role
    };
    
    next();
  } catch (error) {
    console.error('❌ Erreur authentification manager:', error);
    res.status(401).json({
      success: false,
      error: 'Token invalide'
    });
  }
};

// Routes pour les salariés
router.post('/', authenticateEmployee, advanceRequestController.createAdvanceRequest);
router.get('/employee', authenticateEmployee, advanceRequestController.getEmployeeAdvanceRequests);

// Routes pour les managers (accessibles sans authentification, comme les autres routes admin)
router.get('/', advanceRequestController.getAllAdvanceRequests);
router.get('/pending', advanceRequestController.getPendingRequests);
router.get('/stats', advanceRequestController.getAdvanceStats);

// Route de diagnostic temporaire pour vérifier qui aurait reçu les emails
// IMPORTANT: Cette route doit être définie AVANT les routes avec paramètres dynamiques (/:id)
router.get('/diagnostic/email-recipients', async (req, res) => {
  console.log('🔍 Route diagnostic email-recipients appelée');
  try {
    const Employee = require('../models/Employee');
    const Parameter = require('../models/Parameters');
    const AdvanceRequest = require('../models/AdvanceRequest');
    
    console.log('📋 Recherche des employés avec rôle manager/admin...');
    // Vérifier les employés avec rôle manager ou admin (ancienne méthode)
    const managersOldMethod = await Employee.find({ 
      role: { $in: ['manager', 'admin'] }, 
      isActive: true,
      email: { $exists: true, $ne: null, $ne: '' }
    }).select('name email role').sort({ name: 1 });
    
    console.log(`📋 ${managersOldMethod.length} employé(s) trouvé(s) avec rôle manager/admin`);
    
    // Vérifier toutes les demandes d'acompte créées (pour estimer combien d'emails ont été envoyés)
    const allAdvanceRequests = await AdvanceRequest.find({ isActive: true })
      .sort({ createdAt: -1 })
      .select('employeeName employeeEmail amount deductionMonth createdAt status')
      .limit(50); // Limiter aux 50 dernières pour ne pas surcharger
    
    console.log(`📋 ${allAdvanceRequests.length} demande(s) d'acompte trouvée(s)`);
    
    // Calculer combien d'emails auraient été envoyés avec l'ancienne méthode
    const estimatedEmailsSent = allAdvanceRequests.length * managersOldMethod.length;
    
    console.log('📋 Recherche des paramètres email...');
    // Vérifier les paramètres configurés (nouvelle méthode)
    const storeEmailParam = await Parameter.findOne({ name: 'storeEmail' });
    const adminEmailParam = await Parameter.findOne({ name: 'adminEmail' });
    const alertStoreParam = await Parameter.findOne({ name: 'alertStore' });
    const alertAdminParam = await Parameter.findOne({ name: 'alertAdmin' });
    
    console.log('📋 Paramètres récupérés:', {
      storeEmail: storeEmailParam?.stringValue || 'Non configuré',
      adminEmail: adminEmailParam?.stringValue || 'Non configuré',
      alertStore: alertStoreParam?.booleanValue || false,
      alertAdmin: alertAdminParam?.booleanValue || false
    });
    
    const response = {
      success: true,
      data: {
        summary: {
          totalManagersAdmins: managersOldMethod.length,
          totalAdvanceRequests: allAdvanceRequests.length,
          estimatedEmailsSentWithOldMethod: estimatedEmailsSent,
          message: `Avec l'ancienne méthode, ${managersOldMethod.length} personne(s) auraient reçu ${estimatedEmailsSent} email(s) pour ${allAdvanceRequests.length} demande(s) d'acompte`
        },
        oldMethod: {
          description: 'Ancienne méthode (qui causait le problème)',
          recipients: managersOldMethod.map(m => ({
            name: m.name,
            email: m.email,
            role: m.role,
            wouldHaveReceivedEmails: allAdvanceRequests.length
          }))
        },
        newMethod: {
          description: 'Nouvelle méthode (utilise les paramètres)',
          storeEmail: storeEmailParam?.stringValue || 'Non configuré',
          adminEmail: adminEmailParam?.stringValue || 'Non configuré',
          alertStoreEnabled: alertStoreParam?.booleanValue || false,
          alertAdminEnabled: alertAdminParam?.booleanValue || false,
          recipients: [
            ...(alertStoreParam?.booleanValue && storeEmailParam?.stringValue ? [{
              email: storeEmailParam.stringValue,
              type: 'Magasin'
            }] : []),
            ...(alertAdminParam?.booleanValue && adminEmailParam?.stringValue ? [{
              email: adminEmailParam.stringValue,
              type: 'Administrateur'
            }] : [])
          ]
        },
        recentAdvanceRequests: allAdvanceRequests.slice(0, 10).map(req => ({
          employeeName: req.employeeName,
          employeeEmail: req.employeeEmail,
          amount: req.amount,
          deductionMonth: req.deductionMonth,
          createdAt: req.createdAt,
          status: req.status
        }))
      }
    };
    
    console.log('✅ Réponse diagnostic préparée, envoi...');
    res.json(response);
  } catch (error) {
    console.error('❌ Erreur diagnostic:', error);
    console.error('❌ Stack:', error.stack);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Routes avec paramètres dynamiques (doivent être définies APRÈS les routes spécifiques)
router.put('/:id', advanceRequestController.updateAdvanceRequest);
router.delete('/:id', advanceRequestController.deleteAdvanceRequest);

module.exports = router;
