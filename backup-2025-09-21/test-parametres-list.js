// Test de la liste des paramètres
const testParametersList = async () => {
  try {
    console.log('🔍 Récupération de la liste des paramètres...');
    
    const response = await fetch('https://boulangerie-planning-api-3.onrender.com/api/parameters', {
      headers: {
        'Origin': 'https://www.filmara.fr'
      }
    });
    
    console.log('📊 Status:', response.status);
    
    const data = await response.json();
    console.log('📊 Response:', JSON.stringify(data, null, 2));
    
    if (Array.isArray(data)) {
      console.log('✅ Paramètres trouvés:', data.length);
      data.forEach((param, index) => {
        console.log(`  ${index + 1}. ${param.name}: "${param.displayName}" (${param.kmValue} km) - ID: ${param._id}`);
      });
    } else {
      console.log('❌ Format de réponse inattendu');
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
};

testParametersList();
