const axios = require('axios');

async function testConstraintsFinal() {
  console.log('🔍 Test final des contraintes corrigées...');
  
  try {
    // Test 1: Vérifier que l'API répond
    console.log('\n1. Test de connexion à l\'API...');
    const healthResponse = await axios.get('https://boulangerie-planning-api-3.onrender.com/health', {
      timeout: 30000
    });
    console.log('✅ API accessible:', healthResponse.data);
    
    // Test 2: Vérifier les contraintes existantes
    console.log('\n2. Vérification des contraintes (semaine 36, 2025)...');
    const constraintsResponse = await axios.get('https://boulangerie-planning-api-3.onrender.com/api/constraints/36/2025', {
      timeout: 30000
    });
    
    console.log('✅ Contraintes récupérées:', constraintsResponse.data.length, 'contraintes trouvées');
    
    // Test 3: Régénérer le planning avec les contraintes
    console.log('\n3. Régénération du planning avec contraintes...');
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
    
    console.log('✅ Planning régénéré avec succès!');
    console.log('📊 Résumé:', planningResponse.data.message);
    console.log('👥 Nombre de plannings créés:', planningResponse.data.plannings.length);
    
    if (planningResponse.data.deletedCount > 0) {
      console.log('🗑️ Anciens plannings supprimés:', planningResponse.data.deletedCount);
    }
    
    // Test 4: Vérifier que les contraintes sont respectées
    console.log('\n4. Vérification du respect des contraintes...');
    
    // Vérifier Severine (CP le dimanche)
    const severinePlanning = planningResponse.data.plannings.find(p => p.employeeName === 'Severine');
    if (severinePlanning) {
      const dimancheSchedule = severinePlanning.schedule.find(s => s.day === 'Dimanche');
      if (dimancheSchedule && dimancheSchedule.constraint === 'CP') {
        console.log('✅ Severine: CP le dimanche respecté');
      } else {
        console.log('❌ Severine: CP le dimanche NON respecté -', dimancheSchedule?.constraint);
      }
    }
    
    // Vérifier Anaïs (Formation le mercredi)
    const anaisPlanning = planningResponse.data.plannings.find(p => p.employeeName === 'Anaïs');
    if (anaisPlanning) {
      const mercrediSchedule = anaisPlanning.schedule.find(s => s.day === 'Mercredi');
      if (mercrediSchedule && mercrediSchedule.constraint === 'Formation') {
        console.log('✅ Anaïs: Formation le mercredi respectée');
      } else {
        console.log('❌ Anaïs: Formation le mercredi NON respectée -', mercrediSchedule?.constraint);
      }
    }
    
    // Vérifier Vanessa F (MAL toute la semaine)
    const vanessaPlanning = planningResponse.data.plannings.find(p => p.employeeName === 'Vanessa F');
    if (vanessaPlanning) {
      const hasMAL = vanessaPlanning.schedule.some(s => s.constraint === 'MAL');
      if (hasMAL) {
        console.log('✅ Vanessa F: MAL respecté');
      } else {
        console.log('❌ Vanessa F: MAL NON respecté');
      }
    }
    
    console.log('\n🎯 Test terminé !');
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
    
    if (error.response) {
      console.error('📊 Status:', error.response.status);
      console.error('📄 Données d\'erreur:', error.response.data);
    }
  }
}

testConstraintsFinal();
