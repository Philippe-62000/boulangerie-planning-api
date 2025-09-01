const axios = require('axios');

async function testConstraintsSave() {
  console.log('🔍 Test de sauvegarde des contraintes...');
  
  try {
    // Test 1: Vérifier que l'API répond
    console.log('\n1. Test de connexion à l\'API...');
    const healthResponse = await axios.get('https://boulangerie-planning-api-3.onrender.com/health', {
      timeout: 30000
    });
    console.log('✅ API accessible:', healthResponse.data);
    
    // Test 2: Récupérer les employés
    console.log('\n2. Récupération des employés...');
    const employeesResponse = await axios.get('https://boulangerie-planning-api-3.onrender.com/api/employees', {
      timeout: 30000
    });
    console.log('✅ Employés récupérés:', employeesResponse.data.length, 'employés trouvés');
    
    // Test 3: Tester la sauvegarde d'une contrainte simple
    console.log('\n3. Test de sauvegarde d\'une contrainte...');
    const testConstraint = {
      weekNumber: 36,
      year: 2025,
      employeeId: employeesResponse.data[0]._id,
      constraints: {
        Lundi: 'Repos',
        Mardi: 'Repos',
        Mercredi: 'Repos',
        Jeudi: 'Repos',
        Vendredi: 'Repos',
        Samedi: 'Repos',
        Dimanche: 'Repos'
      }
    };
    
    console.log('📤 Données envoyées:', JSON.stringify(testConstraint, null, 2));
    
    const constraintResponse = await axios.post(
      'https://boulangerie-planning-api-3.onrender.com/api/constraints',
      testConstraint,
      {
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ Contrainte sauvegardée avec succès!');
    console.log('📊 Réponse:', constraintResponse.data);
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
    
    if (error.response) {
      console.error('📊 Status:', error.response.status);
      console.error('📄 Données d\'erreur:', error.response.data);
      
      if (error.response.status === 400) {
        console.error('🔍 Erreur 400 - Vérifiez la validation des données');
        console.error('📋 Headers de la requête:', error.config?.headers);
        console.error('📤 Données envoyées:', error.config?.data);
      }
    }
  }
}

testConstraintsSave();
