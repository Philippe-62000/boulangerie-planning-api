const OnboardingOffboarding = require('../models/OnboardingOffboarding');
const Employee = require('../models/Employee');

// Récupérer les démarches pour un employé
exports.getByEmployeeId = async (req, res) => {
  try {
    const { employeeId } = req.params;
    
    console.log('📋 Récupération démarches pour employé:', employeeId);
    
    const record = await OnboardingOffboarding.getByEmployeeId(employeeId);
    
    if (!record) {
      console.log('⚠️ Aucune démarche trouvée, création d\'un enregistrement vide');
      
      // Récupérer le nom de l'employé
      const employee = await Employee.findById(employeeId);
      if (!employee) {
        return res.status(404).json({
          success: false,
          message: 'Employé non trouvé'
        });
      }
      
      // Créer un enregistrement vide
      const newRecord = await OnboardingOffboarding.create({
        employeeId,
        employeeName: employee.name,
        onboarding: {},
        offboarding: {}
      });
      
      return res.json({
        success: true,
        data: newRecord
      });
    }
    
    console.log('✅ Démarches trouvées:', record._id);
    
    res.json({
      success: true,
      data: record
    });
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des démarches:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des démarches',
      error: error.message
    });
  }
};

// Créer ou mettre à jour les démarches
exports.createOrUpdate = async (req, res) => {
  try {
    const { employeeId, employeeName, onboarding, offboarding, entryDate, exitDate } = req.body;
    
    console.log('💾 Sauvegarde démarches pour:', employeeName);
    console.log('📊 Données reçues:', { onboarding, offboarding });
    
    if (!employeeId) {
      return res.status(400).json({
        success: false,
        message: 'employeeId est requis'
      });
    }
    
    const data = {
      employeeName,
      onboarding: onboarding || {},
      offboarding: offboarding || {},
      entryDate: entryDate || null,
      exitDate: exitDate || null
    };
    
    const record = await OnboardingOffboarding.createOrUpdate(employeeId, employeeName, data);
    
    console.log('✅ Démarches sauvegardées:', record._id);
    
    res.json({
      success: true,
      message: 'Démarches sauvegardées avec succès',
      data: record
    });
  } catch (error) {
    console.error('❌ Erreur lors de la sauvegarde des démarches:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la sauvegarde des démarches',
      error: error.message
    });
  }
};

// Récupérer toutes les démarches
exports.getAll = async (req, res) => {
  try {
    console.log('📋 Récupération de toutes les démarches');
    
    const records = await OnboardingOffboarding.find({ isActive: true })
      .populate('employeeId', 'name email')
      .sort({ createdAt: -1 });
    
    console.log(`✅ ${records.length} démarches récupérées`);
    
    res.json({
      success: true,
      data: records
    });
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des démarches:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des démarches',
      error: error.message
    });
  }
};

// Récupérer les obligations légales en attente
exports.getPendingLegalObligations = async (req, res) => {
  try {
    console.log('⚠️ Récupération des obligations légales en attente');
    
    const pendingObligations = await OnboardingOffboarding.getPendingLegalObligations();
    
    console.log(`✅ ${pendingObligations.length} obligations en attente`);
    
    res.json({
      success: true,
      data: pendingObligations
    });
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des obligations légales:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des obligations légales',
      error: error.message
    });
  }
};

// Supprimer les démarches d'un employé
exports.deleteByEmployeeId = async (req, res) => {
  try {
    const { employeeId } = req.params;
    
    console.log('🗑️ Suppression démarches pour employé:', employeeId);
    
    const result = await OnboardingOffboarding.findOneAndUpdate(
      { employeeId },
      { isActive: false },
      { new: true }
    );
    
    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Démarches non trouvées'
      });
    }
    
    console.log('✅ Démarches désactivées:', result._id);
    
    res.json({
      success: true,
      message: 'Démarches supprimées avec succès'
    });
  } catch (error) {
    console.error('❌ Erreur lors de la suppression des démarches:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression des démarches',
      error: error.message
    });
  }
};

