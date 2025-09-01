const API_BASE = 'https://boulangerie-planning-api.onrender.com/api';

async function testApiApresDeploy() {
  console.log('🧪 TEST API APRES DEPLOIEMENT');
  console.log('==============================\n');

  try {
    // 1. Test création d'employé (ne doit plus donner d'erreur 400)
    console.log('1️⃣ Test création d\'employé...');
    const testEmployee = {
      name: "Test Employé",
      contractType: "CDI",
      age: 25,
      role: "vendeuse",
      weeklyHours: 35,
      skills: ["Ouverture"]
    };

    const createResponse = await fetch(`${API_BASE}/employees`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testEmployee)
    });

    if (createResponse.ok) {
      const newEmployee = await createResponse.json();
      console.log(`✅ Employé créé avec succès: ${newEmployee.name}`);
      console.log(`   - ID: ${newEmployee._id}`);
      console.log(`   - birthDate: ${newEmployee.birthDate || '❌ Non défini'}`);
      console.log(`   - isMinor: ${newEmployee.isMinor || '❌ Non défini'}`);
      
      // 2. Test mise à jour avec birthDate
      console.log('\n2️⃣ Test mise à jour avec birthDate...');
      const updateResponse = await fetch(`${API_BASE}/employees/${newEmployee._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          birthDate: '2000-01-01',
          contractEndDate: '2026-12-31'
        })
      });

      if (updateResponse.ok) {
        const updatedEmployee = await updateResponse.json();
        console.log(`✅ Employé mis à jour avec succès`);
        console.log(`   - birthDate: ${updatedEmployee.birthDate ? '✅' : '❌'}`);
        console.log(`   - contractEndDate: ${updatedEmployee.contractEndDate ? '✅' : '❌'}`);
        console.log(`   - isMinor: ${updatedEmployee.isMinor ? '✅' : '❌'}`);
      } else {
        const error = await updateResponse.text();
        console.log(`❌ Erreur mise à jour: ${error}`);
      }

      // 3. Supprimer l'employé de test
      console.log('\n3️⃣ Nettoyage - Suppression employé de test...');
      await fetch(`${API_BASE}/employees/${newEmployee._id}`, {
        method: 'DELETE'
      });
      console.log('✅ Employé de test supprimé');

    } else {
      const error = await createResponse.text();
      console.log(`❌ Erreur création: ${error}`);
    }

    // 4. Test récupération des employés existants
    console.log('\n4️⃣ Test récupération employés existants...');
    const employeesResponse = await fetch(`${API_BASE}/employees`);
    const employees = await employeesResponse.json();
    console.log(`✅ ${employees.length} employés récupérés`);

    // 5. Vérifier les champs des employés existants
    console.log('\n5️⃣ Vérification des champs...');
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

    console.log('\n🎉 Tests terminés !');

  } catch (error) {
    console.error('❌ Erreur générale:', error.message);
  }
}

testApiApresDeploy();





