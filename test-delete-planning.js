const axios = require('axios');

async function deletePlanning() {
  console.log('🗑️ Suppression de l\'ancien planning de la semaine 36...');
  
  try {
    // Récupérer les plannings de la semaine 36
    const planningResponse = await axios.get('https://boulangerie-planning-api-3.onrender.com/api/planning/36/2025', {
      timeout: 30000
    });
    
    console.log(`📋 ${planningResponse.data.length} plannings trouvés pour la semaine 36`);
    
    if (planningResponse.data.length > 0) {
      // Supprimer chaque planning
      for (const planning of planningResponse.data) {
        try {
          await axios.delete(`https://boulangerie-planning-api-3.onrender.com/api/planning/${planning._id}`, {
            timeout: 30000
          });
          console.log(`✅ Planning de ${planning.employeeName} supprimé`);
        } catch (error) {
          console.error(`❌ Erreur lors de la suppression du planning de ${planning.employeeName}:`, error.message);
        }
      }
    }
    
    console.log('✅ Suppression terminée');
    
  } catch (error) {
    console.error('❌ Erreur lors de la suppression:', error.message);
    
    if (error.response) {
      console.error('📊 Status:', error.response.status);
      console.error('📄 Données d\'erreur:', error.response.data);
    }
  }
}

deletePlanning();
