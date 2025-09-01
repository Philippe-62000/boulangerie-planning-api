const mongoose = require('mongoose');
const Employee = require('./backend/models/Employee');

// Configuration MongoDB
const MONGODB_URI = 'mongodb+srv://phimjc:ZDOPZA2Kd8ylewoR@cluster0.4huietv.mongodb.net/boulangerie-planning?retryWrites=true&w=majority';

async function checkDatabase() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connecté à MongoDB Atlas');

    // Vérifier les employés
    const employees = await Employee.find({});
    console.log(`📊 ${employees.length} employés trouvés`);

    employees.forEach((emp, index) => {
      console.log(`\n👤 Employé ${index + 1}: ${emp.name}`);
      console.log(`   - ID: ${emp._id}`);
      console.log(`   - Âge: ${emp.age}`);
      console.log(`   - Date de naissance: ${emp.birthDate || '❌ MANQUANT'}`);
      console.log(`   - Mineur: ${emp.isMinor || '❌ MANQUANT'}`);
      console.log(`   - Date fin contrat: ${emp.contractEndDate || '❌ MANQUANT'}`);
      console.log(`   - Arrêt maladie: ${emp.sickLeave ? '✅ Présent' : '❌ MANQUANT'}`);
      if (emp.sickLeave) {
        console.log(`     - En arrêt: ${emp.sickLeave.isOnSickLeave}`);
        console.log(`     - Début: ${emp.sickLeave.startDate}`);
        console.log(`     - Fin: ${emp.sickLeave.endDate}`);
      }
    });

    // Vérifier les contraintes
    const WeeklyConstraints = require('./backend/models/WeeklyConstraints');
    const constraints = await WeeklyConstraints.find({});
    console.log(`\n📅 ${constraints.length} contraintes trouvées`);

    // Vérifier les plannings
    const Planning = require('./backend/models/Planning');
    const plannings = await Planning.find({});
    console.log(`📋 ${plannings.length} plannings trouvés`);

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnecté de MongoDB');
  }
}

checkDatabase();
