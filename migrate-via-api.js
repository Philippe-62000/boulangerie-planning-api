const API_BASE = 'https://boulangerie-planning-api.onrender.com/api';

async function migrateViaAPI() {
  console.log('🔄 MIGRATION VIA API RENDER');
  console.log('============================\n');

  try {
    // 1. Récupérer tous les employés
    console.log('1️⃣ Récupération des employés...');
    const employeesResponse = await fetch(`${API_BASE}/employees`);
    const employees = await employeesResponse.json();
    console.log(`✅ ${employees.length} employés récupérés`);

    let updatedCount = 0;
    let errorCount = 0;

    // 2. Migrer chaque employé
    for (const employee of employees) {
      try {
        console.log(`\n🔄 Migration de ${employee.name}...`);
        
        const updates = {};
        
        // Ajouter birthDate si manquant (calculer à partir de l'âge)
        if (!employee.birthDate && employee.age) {
          const currentYear = new Date().getFullYear();
          const birthYear = currentYear - employee.age;
          updates.birthDate = new Date(birthYear, 0, 1).toISOString().split('T')[0];
          console.log(`   📅 Ajout date de naissance: ${updates.birthDate}`);
        }
        
        // Ajouter contractEndDate si manquant (pour les apprentis)
        if (!employee.contractEndDate && employee.contractType === 'Apprentissage') {
          const currentDate = new Date();
          updates.contractEndDate = new Date(currentDate.getFullYear() + 2, currentDate.getMonth(), currentDate.getDate()).toISOString().split('T')[0];
          console.log(`   📋 Ajout date fin contrat: ${updates.contractEndDate}`);
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
          const updateResponse = await fetch(`${API_BASE}/employees/${employee._id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(updates)
          });

          if (updateResponse.ok) {
            const updatedEmployee = await updateResponse.json();
            console.log(`✅ ${employee.name} mis à jour avec succès`);
            console.log(`   - birthDate: ${updatedEmployee.birthDate || '❌'}`);
            console.log(`   - contractEndDate: ${updatedEmployee.contractEndDate || '❌'}`);
            console.log(`   - sickLeave: ${updatedEmployee.sickLeave ? '✅' : '❌'}`);
            console.log(`   - isMinor: ${updatedEmployee.isMinor ? '✅' : '❌'}`);
            updatedCount++;
          } else {
            const error = await updateResponse.text();
            console.log(`❌ Échec de la mise à jour de ${employee.name}: ${error}`);
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

    // 3. Vérification finale
    console.log('\n🔍 Vérification finale...');
    const finalResponse = await fetch(`${API_BASE}/employees`);
    const finalEmployees = await finalResponse.json();
    
    let hasBirthDate = 0;
    let hasSickLeave = 0;
    let hasContractEndDate = 0;
    let isMinor = 0;

    finalEmployees.forEach(emp => {
      if (emp.birthDate) hasBirthDate++;
      if (emp.sickLeave) hasSickLeave++;
      if (emp.contractEndDate) hasContractEndDate++;
      if (emp.isMinor) isMinor++;
    });

    console.log(`📅 Employés avec birthDate: ${hasBirthDate}/${finalEmployees.length}`);
    console.log(`🏥 Employés avec sickLeave: ${hasSickLeave}/${finalEmployees.length}`);
    console.log(`📋 Employés avec contractEndDate: ${hasContractEndDate}/${finalEmployees.length}`);
    console.log(`👶 Employés mineurs: ${isMinor}/${finalEmployees.length}`);

  } catch (error) {
    console.error('❌ Erreur générale:', error.message);
  }
}

migrateViaAPI();
