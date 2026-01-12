const mongoose = require('mongoose');
const Employee = require('../models/Employee');
const config = require('../config');

/**
 * Script pour nettoyer les employés avec saleCode vide (chaîne vide)
 * Convertit les chaînes vides en null pour éviter les conflits d'index unique
 */

async function cleanupEmptySaleCodes() {
  try {
    console.log('🧹 Démarrage du nettoyage des saleCode vides...');
    
    // Connexion à MongoDB
    const mongoUri = process.env.MONGODB_URI || config.MONGODB_URI;
    await mongoose.connect(mongoUri);
    console.log('✅ Connexion à MongoDB établie');
    
    // Trouver tous les employés avec saleCode vide (chaîne vide)
    const employeesWithEmptySaleCode = await Employee.find({ saleCode: '' });
    console.log(`📊 ${employeesWithEmptySaleCode.length} employés avec saleCode vide trouvés`);
    
    if (employeesWithEmptySaleCode.length === 0) {
      console.log('✅ Aucun employé avec saleCode vide à nettoyer');
      return;
    }
    
    // Afficher les employés qui seront nettoyés
    console.log('\n📋 Employés qui seront nettoyés :');
    employeesWithEmptySaleCode.forEach((emp, index) => {
      console.log(`${index + 1}. ${emp.name} (${emp.role}) - ID: ${emp._id}`);
    });
    
    // Convertir les chaînes vides en null
    const result = await Employee.updateMany(
      { saleCode: '' },
      { $set: { saleCode: null } }
    );
    
    console.log(`\n✅ ${result.modifiedCount} employés mis à jour (saleCode: '' -> null)`);
    console.log('🎉 Nettoyage terminé avec succès !');
    
  } catch (error) {
    console.error('❌ Erreur lors du nettoyage:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Connexion MongoDB fermée');
  }
}

// Exécuter le script si appelé directement
if (require.main === module) {
  cleanupEmptySaleCodes()
    .then(() => {
      console.log('✅ Script terminé avec succès');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Erreur fatale:', error);
      process.exit(1);
    });
}

module.exports = cleanupEmptySaleCodes;
