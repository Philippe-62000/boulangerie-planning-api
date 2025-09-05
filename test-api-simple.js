async function testEmployeesAPI() {
  try {
    console.log('🧪 Test de l\'API /api/employees...');
    
    const response = await fetch('http://localhost:5000/api/employees');
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    console.log('✅ API accessible');
    console.log(`📊 ${data.length} employés récupérés`);
    
    // Vérifier la structure des données
    if (data.length > 0) {
      const firstEmployee = data[0];
      console.log('\n👤 Premier employé:');
      console.log(`   Nom: ${firstEmployee.name}`);
      console.log(`   Rôle: ${firstEmployee.role}`);
      
      // Vérifier les absences
      if (firstEmployee.absences) {
        console.log('\n📅 Absences:');
        console.log(`   Absences actuelles: ${firstEmployee.absences.current?.length || 0}`);
        console.log(`   Absences futures: ${firstEmployee.absences.future?.length || 0}`);
        console.log(`   Total absences: ${firstEmployee.absences.all?.length || 0}`);
      }
      
      if (firstEmployee.sickLeaves) {
        console.log('\n🏥 Arrêts maladie:');
        console.log(`   Arrêts actuels: ${firstEmployee.sickLeaves.current?.length || 0}`);
        console.log(`   Arrêts futurs: ${firstEmployee.sickLeaves.future?.length || 0}`);
        console.log(`   Total arrêts: ${firstEmployee.sickLeaves.all?.length || 0}`);
      }
      
      if (firstEmployee.delays) {
        console.log('\n⏰ Retards:');
        console.log(`   Retards actuels: ${firstEmployee.delays.current?.length || 0}`);
        console.log(`   Retards futurs: ${firstEmployee.delays.future?.length || 0}`);
        console.log(`   Total retards: ${firstEmployee.delays.all?.length || 0}`);
      }
      
      console.log(`\n📊 Total absences: ${firstEmployee.totalAbsences || 0}`);
    }
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
  }
}

// Attendre que le serveur démarre
setTimeout(testEmployeesAPI, 5000);

