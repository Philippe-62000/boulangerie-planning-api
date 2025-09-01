const mongoose = require('mongoose');
<<<<<<< HEAD
const Employee = require('./backend/models/Employee');

// Configuration MongoDB (utiliser la même que votre API)
const MONGODB_URI = 'mongodb+srv://phimjc:ZDOPZA2Kd8ylewoR@cluster0.4huietv.mongodb.net/boulangerie-planning?retryWrites=true&w=majority';
=======
const Employee = require('./models/Employee');

// Configuration MongoDB (utiliser la même que votre API)
const MONGODB_URI = 'mongodb+srv://philippe62000:Philippe62000@cluster0.mongodb.net/boulangerie-planning?retryWrites=true&w=majority';
>>>>>>> 443a6b525e041691af7ca6aec0344707cf3e4762

async function migrateEmployees() {
  try {
    // Connexion à MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connecté à MongoDB Atlas');

    // Récupérer tous les employés
    const employees = await Employee.find({});
    console.log(`📊 ${employees.length} employés trouvés`);

    for (const employee of employees) {
      console.log(`🔄 Migration de ${employee.name}...`);
      
      const updates = {};
      
      // Ajouter birthDate si manquant (calculer à partir de l'âge)
      if (!employee.birthDate && employee.age) {
        const currentYear = new Date().getFullYear();
        const birthYear = currentYear - employee.age;
        updates.birthDate = new Date(birthYear, 0, 1); // 1er janvier de l'année de naissance
      }
      
      // Ajouter contractEndDate si manquant (pour les apprentis)
      if (!employee.contractEndDate && employee.contractType === 'Apprentissage') {
        const currentDate = new Date();
        updates.contractEndDate = new Date(currentDate.getFullYear() + 2, currentDate.getMonth(), currentDate.getDate());
      }
      
      // Ajouter sickLeave si manquant
      if (!employee.sickLeave) {
        updates.sickLeave = {
          isOnSickLeave: false,
          startDate: null,
          endDate: null
        };
      }
      
      // Mettre à jour l'employé si des changements sont nécessaires
      if (Object.keys(updates).length > 0) {
        await Employee.findByIdAndUpdate(employee._id, updates, { new: true });
        console.log(`✅ ${employee.name} mis à jour`);
      } else {
        console.log(`ℹ️ ${employee.name} déjà à jour`);
      }
    }

    console.log('🎉 Migration terminée avec succès !');
    
  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnecté de MongoDB');
  }
}

// Exécuter la migration
migrateEmployees();
