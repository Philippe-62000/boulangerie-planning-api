const API_BASE = 'https://boulangerie-planning-api.onrender.com/api';

async function testSimple() {
  console.log('🧪 TEST SIMPLE DES FONCTIONNALITES');
  console.log('===================================\n');

  try {
    // 1. Test récupération des employés
    console.log('1️⃣ Test récupération des employés...');
    const employeesResponse = await fetch(`${API_BASE}/employees`);
    const employees = await employeesResponse.json();
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

    // 3. Test contraintes
    console.log('\n3️⃣ Test contraintes...');
    try {
      const constraintsResponse = await fetch(`${API_BASE}/constraints/35/2025`);
      const constraints = await constraintsResponse.json();
      console.log(`✅ Contraintes récupérées: ${constraints.length} contraintes`);
    } catch (error) {
      console.log(`❌ Erreur contraintes: ${error.message}`);
    }

    // 4. Test planning
    console.log('\n4️⃣ Test planning...');
    try {
      const planningResponse = await fetch(`${API_BASE}/planning/35/2025`);
      const planning = await planningResponse.json();
      console.log(`✅ Planning récupéré: ${planning.length} shifts`);
    } catch (error) {
      console.log(`❌ Erreur planning: ${error.message}`);
    }

    console.log('\n🎉 Tests terminés !');

  } catch (error) {
    console.error('❌ Erreur générale:', error.message);
  }
}

testSimple();
