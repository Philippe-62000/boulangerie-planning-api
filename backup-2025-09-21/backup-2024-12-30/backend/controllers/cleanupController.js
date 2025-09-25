const Employee = require('../models/Employee');

// Nettoyer les arrêts maladie expirés depuis plus de 8 jours
exports.cleanExpiredSickLeaves = async (req, res) => {
  try {
    console.log('🧹 Début du nettoyage des arrêts maladie expirés...');
    
    const today = new Date();
    const eightDaysAgo = new Date(today.getTime() - (8 * 24 * 60 * 60 * 1000));
    
    console.log('📅 Date limite:', eightDaysAgo.toLocaleDateString('fr-FR'));
    
    // Trouver tous les employés avec un arrêt maladie actif
    const employeesWithSickLeave = await Employee.find({
      'sickLeave.isOnSickLeave': true
    });
    
    console.log(`📊 ${employeesWithSickLeave.length} employés avec arrêt maladie trouvés`);
    
    let cleaned = 0;
    const cleanedEmployees = [];
    
    for (const employee of employeesWithSickLeave) {
      if (employee.sickLeave.endDate && new Date(employee.sickLeave.endDate) <= eightDaysAgo) {
        console.log(`🧹 Nettoyage pour ${employee.name} (arrêt terminé le ${employee.sickLeave.endDate.toLocaleDateString('fr-FR')})`);
        
        await Employee.findByIdAndUpdate(employee._id, {
          'sickLeave.isOnSickLeave': false,
          'sickLeave.startDate': undefined,
          'sickLeave.endDate': undefined
        });
        
        cleanedEmployees.push({
          name: employee.name,
          endDate: employee.sickLeave.endDate
        });
        cleaned++;
      }
    }
    
    console.log(`✅ ${cleaned} arrêts maladie nettoyés`);
    
    res.json({
      success: true,
      message: `${cleaned} arrêts maladie expirés nettoyés`,
      cleanedCount: cleaned,
      cleanedEmployees: cleanedEmployees
    });
    
  } catch (error) {
    console.error('❌ Erreur lors du nettoyage:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Nettoyage automatique au démarrage du serveur
exports.autoCleanup = async () => {
  try {
    console.log('🧹 Nettoyage automatique des arrêts maladie expirés...');
    
    const today = new Date();
    const eightDaysAgo = new Date(today.getTime() - (8 * 24 * 60 * 60 * 1000));
    
    const result = await Employee.updateMany(
      {
        'sickLeave.isOnSickLeave': true,
        'sickLeave.endDate': { $lte: eightDaysAgo }
      },
      {
        'sickLeave.isOnSickLeave': false,
        'sickLeave.startDate': undefined,
        'sickLeave.endDate': undefined
      }
    );
    
    if (result.modifiedCount > 0) {
      console.log(`✅ ${result.modifiedCount} arrêts maladie expirés nettoyés automatiquement`);
    } else {
      console.log('✅ Aucun arrêt maladie expiré à nettoyer');
    }
    
  } catch (error) {
    console.error('❌ Erreur lors du nettoyage automatique:', error);
  }
};
