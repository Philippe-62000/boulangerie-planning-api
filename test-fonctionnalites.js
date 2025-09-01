const axios = require('axios');

const API_BASE = 'https://boulangerie-planning-api.onrender.com/api';

async function testFonctionnalites() {
  console.log('🧪 TEST DES FONCTIONNALITES');
  console.log('============================\n');

  try {
    // 1. Test récupération des employés
    console.log('1️⃣ Test récupération des employés...');
    const employeesResponse = await axios.get(`${API_BASE}/employees`);
    const employees = employeesResponse.data;
    console.log(`✅ ${employees.length} employés récupérés`);

    // 2. Vérifier les nouveaux champs
    console.log('\n2️⃣ Vérification des nouveaux champs...');
    let hasBirthDate = 0;
    let hasSickLeave = 0;
    let hasContractEndDate = 0;
    let isMinor = 0;

    employees.forEach(emp => {
      if (emp.birthDate) hasBirthDate++;
      if (emp.sickLeave) hasSickLeave++;
      if (emp.contractEndDate) hasContractEndDate++;
      if (emp.isMinor) isMinor++;
    });

    console.log(`📅 Employés avec birthDate: ${hasBirthDate}/${employees.length}`);
    console.log(`🏥 Employés avec sickLeave: ${hasSickLeave}/${employees.length}`);
    console.log(`📋 Employés avec contractEndDate: ${hasContractEndDate}/${employees.length}`);
    console.log(`👶 Employés mineurs: ${isMinor}/${employees.length}`);

    // 3. Test déclaration arrêt maladie
    console.log('\n3️⃣ Test déclaration arrêt maladie...');
    if (employees.length > 0) {
      const testEmployee = employees[0];
      const sickLeaveData = {
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      };

      try {
        const sickLeaveResponse = await axios.patch(
          `${API_BASE}/employees/${testEmployee._id}/sick-leave`,
          sickLeaveData
        );
        console.log(`✅ Arrêt maladie déclaré pour ${testEmployee.name}`);
        console.log(`   Début: ${sickLeaveData.startDate}`);
        console.log(`   Fin: ${sickLeaveData.endDate}`);
      } catch (error) {
        console.log(`❌ Erreur arrêt maladie: ${error.response?.data?.error || error.message}`);
      }
    }

    // 4. Test contraintes
    console.log('\n4️⃣ Test contraintes...');
    try {
      const constraintsResponse = await axios.get(`${API_BASE}/constraints/35/2025`);
      console.log(`✅ Contraintes récupérées: ${constraintsResponse.data.length} contraintes`);
    } catch (error) {
      console.log(`❌ Erreur contraintes: ${error.response?.data?.error || error.message}`);
    }

    // 5. Test planning
    console.log('\n5️⃣ Test planning...');
    try {
      const planningResponse = await axios.get(`${API_BASE}/planning/35/2025`);
      console.log(`✅ Planning récupéré: ${planningResponse.data.length} shifts`);
    } catch (error) {
      console.log(`❌ Erreur planning: ${error.response?.data?.error || error.message}`);
    }

    // 6. Test mise à jour employé
    console.log('\n6️⃣ Test mise à jour employé...');
    if (employees.length > 0) {
      const testEmployee = employees[0];
      const updateData = {
        birthDate: '2000-01-01',
        contractEndDate: '2026-12-31'
      };

      try {
        const updateResponse = await axios.put(
          `${API_BASE}/employees/${testEmployee._id}`,
          updateData
        );
        console.log(`✅ Employé ${testEmployee.name} mis à jour`);
        console.log(`   Nouvelle date de naissance: ${updateResponse.data.birthDate}`);
      } catch (error) {
        console.log(`❌ Erreur mise à jour: ${error.response?.data?.error || error.message}`);
      }
    }

    console.log('\n🎉 Tests terminés !');

  } catch (error) {
    console.error('❌ Erreur générale:', error.message);
  }
}

testFonctionnalites();
