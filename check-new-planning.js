const axios = require('axios');

async function checkNewPlanning() {
  console.log('🔍 Vérification du nouveau planning généré...');
  
  try {
    // Récupérer le planning de la semaine 36
    console.log('\n1. Récupération du planning semaine 36...');
    const planningResponse = await axios.get('https://boulangerie-planning-api-3.onrender.com/api/planning/36/2025', {
      timeout: 30000
    });
    
    console.log('✅ Planning récupéré:', planningResponse.data.length, 'plannings trouvés');
    
    // Afficher les contraintes respectées
    console.log('\n2. Vérification des contraintes respectées:');
    
    planningResponse.data.forEach(planning => {
      console.log(`\n👤 ${planning.employeeName}:`);
      
      // Trouver les jours avec contraintes (pas de repos)
      const constraintDays = planning.schedule.filter(s => s.constraint && s.constraint !== 'Repos');
      
      if (constraintDays.length > 0) {
        constraintDays.forEach(day => {
          console.log(`  ${day.day}: ${day.constraint}`);
        });
      } else {
        console.log('  Aucune contrainte spéciale');
      }
      
      console.log(`  Total: ${planning.totalWeeklyHours}h / ${planning.contractedHours}h`);
    });
    
    console.log('\n🎯 Vérification terminée !');
    
  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error.message);
    
    if (error.response) {
      console.error('📊 Status:', error.response.status);
      console.error('📄 Données d\'erreur:', error.response.data);
    }
  }
}

checkNewPlanning();
