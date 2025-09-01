const axios = require('axios');

async function testPlanningAPI() {
  console.log('🔍 Test de l\'API de génération de planning...');
  
  try {
    // Test 1: Vérifier que l'API répond
    console.log('\n1. Test de connexion à l\'API...');
    const healthResponse = await axios.get('https://boulangerie-planning-api-3.onrender.com/health', {
      timeout: 10000
    });
    console.log('✅ API accessible:', healthResponse.data);
    
    // Test 2: Vérifier les employés
    console.log('\n2. Test de récupération des employés...');
    const employeesResponse = await axios.get('https://boulangerie-planning-api-3.onrender.com/api/employees', {
      timeout: 10000
    });
    console.log('✅ Employés récupérés:', employeesResponse.data.length, 'employés trouvés');
    
    if (employeesResponse.data.length === 0) {
      console.log('❌ Aucun employé trouvé - impossible de générer un planning');
      return;
    }
    
    // Test 3: Générer un planning pour la semaine 36
    console.log('\n3. Test de génération de planning (semaine 36, 2025)...');
    const planningData = {
      weekNumber: 36,
      year: 2025,
      affluenceLevels: {
        Lundi: 2, Mardi: 2, Mercredi: 2, Jeudi: 2, 
        Vendredi: 2, Samedi: 2, Dimanche: 2
      }
    };
    
    console.log('📤 Données envoyées:', JSON.stringify(planningData, null, 2));
    
    const planningResponse = await axios.post(
      'https://boulangerie-planning-api-3.onrender.com/api/planning/generate',
      planningData,
      {
        timeout: 60000,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ Planning généré avec succès!');
    console.log('📊 Résumé:', planningResponse.data.message);
    console.log('👥 Nombre de plannings créés:', planningResponse.data.plannings.length);
    
    // Afficher un aperçu du premier planning
    if (planningResponse.data.plannings.length > 0) {
      const firstPlanning = planningResponse.data.plannings[0];
      console.log('\n📅 Premier planning (exemple):');
      console.log('- Employé:', firstPlanning.employeeName);
      console.log('- Semaine:', firstPlanning.weekNumber);
      console.log('- Année:', firstPlanning.year);
      console.log('- Heures totales:', firstPlanning.totalWeeklyHours);
      console.log('- Jours planifiés:', firstPlanning.schedule.length);
    }
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
    
    if (error.response) {
      console.error('📊 Status:', error.response.status);
      console.error('📄 Données d\'erreur:', error.response.data);
      
      if (error.response.status === 500) {
        console.error('🔍 Erreur serveur - vérifiez les logs Render');
      }
    } else if (error.code === 'ECONNABORTED') {
      console.error('⏰ Timeout - l\'API prend trop de temps à répondre');
    } else if (error.code === 'ENOTFOUND') {
      console.error('🌐 L\'URL de l\'API n\'est pas accessible');
    }
  }
}

testPlanningAPI();

