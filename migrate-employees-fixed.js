const mongoose = require('mongoose');
const Employee = require('./backend/models/Employee');

// Configuration MongoDB
const MONGODB_URI = 'mongodb+srv://phimjc:ZDOPZA2Kd8ylewoR@cluster0.4huietv.mongodb.net/boulangerie-planning?retryWrites=true&w=majority';

async function migrateEmployees() {
  try {
    console.log('🔄 Connexion à MongoDB Atlas...');
    
    // Configuration de la connexion avec timeout plus long
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      bufferCommands: false
    });
    
    console.log('✅ Connecté à MongoDB Atlas');

    // Récupérer tous les employés
    console.log('📊 Récupération des employés...');
    const employees = await Employee.find({});
    console.log(`📊 ${employees.length} employés trouvés`);

    let updatedCount = 0;
    let errorCount = 0;

    for (const employee of employees) {
      try {
        console.log(`\n🔄 Migration de ${employee.name}...`);
        
        const updates = {};
        
        // Ajouter birthDate si manquant (calculer à partir de l'âge)
        if (!employee.birthDate && employee.age) {
          const currentYear = new Date().getFullYear();
          const birthYear = currentYear - employee.age;
          updates.birthDate = new Date(birthYear, 0, 1); // 1er janvier de l'année de naissance
          console.log(`   📅 Ajout date de naissance: ${updates.birthDate.toISOString().split('T')[0]}`);
        }
        
        // Ajouter contractEndDate si manquant (pour les apprentis)
        if (!employee.contractEndDate && employee.contractType === 'Apprentissage') {
          const currentDate = new Date();
          updates.contractEndDate = new Date(currentDate.getFullYear() + 2, currentDate.getMonth(), currentDate.getDate());
          console.log(`   📋 Ajout date fin contrat: ${updates.contractEndDate.toISOString().split('T')[0]}`);
        }
        
        // Ajouter sickLeave si manquant
        if (!employee.sickLeave) {
          updates.sickLeave = {
            isOnSickLeave: false,
            startDate: null,
            endDate: null
          };
          console.log(`   🏥 Ajout structure arrêt maladie`);
        }
        
        // Mettre à jour l'employé si des changements sont nécessaires
        if (Object.keys(updates).length > 0) {
          const updatedEmployee = await Employee.findByIdAndUpdate(
            employee._id, 
            updates, 
            { 
              new: true, 
              runValidators: true,
              upsert: false 
            }
          );
          
          if (updatedEmployee) {
            console.log(`✅ ${employee.name} mis à jour avec succès`);
            updatedCount++;
          } else {
            console.log(`❌ Échec de la mise à jour de ${employee.name}`);
            errorCount++;
          }
        } else {
          console.log(`ℹ️ ${employee.name} déjà à jour`);
        }
        
      } catch (error) {
        console.error(`❌ Erreur lors de la migration de ${employee.name}:`, error.message);
        errorCount++;
      }
    }

    console.log('\n🎉 Migration terminée !');
    console.log(`📊 Résumé:`);
    console.log(`   ✅ Employés mis à jour: ${updatedCount}`);
    console.log(`   ❌ Erreurs: ${errorCount}`);
    console.log(`   📋 Total: ${employees.length}`);

  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
  } finally {
    try {
      await mongoose.disconnect();
      console.log('🔌 Déconnecté de MongoDB');
    } catch (disconnectError) {
      console.error('❌ Erreur lors de la déconnexion:', disconnectError);
    }
  }
}

// Exécuter la migration
migrateEmployees();
