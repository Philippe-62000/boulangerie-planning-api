const axios = require('axios');

async function testEmployeesAPI() {
  try {
    console.log('🧪 Test de l\'API /api/employees...');
    
    const response = await axios.get('http://localhost:5000/api/employees');
    
    console.log('✅ API accessible');
    console.log(`📊 ${response.data.length} employés récupérés`);
    
    // Vérifier la structure des données
    if (response.data.length > 0) {
      const firstEmployee = response.data[0];
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
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    }
  }
}

// Attendre que le serveur démarre
setTimeout(testEmployeesAPI, 3000);

